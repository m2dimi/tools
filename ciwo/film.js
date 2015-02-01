var sandcrawler = require('sandcrawler'),
    logger      = require('sandcrawler-logger'),  
    artoo       = require('artoo-js'),
    fs          = require('fs'),
    csv         = require('fast-csv');

/* 
  This simple piece of code allow you to get 
  film details
*/
var throttle = function(options){
  return function(scraper) { // dogma.
    scraper.beforeScraping(function(req, next) {
      setTimeout(next, Math.random()*options.wait);
    })
  }
}

// details list
var stream = fs.createReadStream("list.csv"),
    urls = [],
    results = [];


// the film scraper
var film = new sandcrawler
    .scraper('film')
    .limit(2)

  .timeout(30 * 1000)

  .config({
    params: {
      page: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
      }
    }
  })

  .use(logger({
    color: 'blue'
  }))

  .use(throttle({
    wait: 5367
  }))

  .jawascript(function(done) {
    var data = artoo.scrape('#title-overview-widget', {
      title: {
        sel:'h1 .itemprop[itemprop=name]'
      },
      rating: {
        sel: '[itemprop=ratingValue]'
      },
      stars:{
        sel:'[itemprop=actors] a',
        method: function(){
          var a=[];
          artoo.$(this).each(function(i,e){
            a.push(
              ///url: base_url + artoo.$(this).attr('href'),
              artoo.$(this).text().trim()
            );
          });
          return a.join('|');
        }
      },
      syn: {
        sel: "[itemprop=description]"
      },
      director: {
        sel:"[itemprop=director] a",
        method: function() {
          var a=[];
          artoo.$(this).each(function(i,e){
            a.push(
              ///url: base_url + artoo.$(this).attr('href'),
              artoo.$(this).text().trim()
            );
          });
          return a.join('|');
        }
      }
    });
    done(data);
  })

  .result(function(err, req, res) {
    
    
    if(!err){
      for(var i in res.data)
        res.data[i].url = req.url;
      //console.log(res.data, req.url)
      results = results.concat(res.data);
    } else {
      req.retry();
    }
  });


var csvStream = csv({delimiter: ',', headers: true})
    .on("data", function(data){
      urls.push(data);
    })
    .on("end", function(){
      urls = urls.map(function(d) {
        return d.url;
      });
      console.log("starting crawler on", urls.length, "urls");
      film.url(urls);
      sandcrawler.run(film, function(err, remains) {
        //console.log(results);
        console.log('sandcrawler finished. Good job guy! saving results...');

        csv
          .writeToPath("list.crawled.csv", results, {
            headers: true
          }).on("finish", function(){
            console.log("results saved, everything is ok");
          });
      });
    })
// read csv
//

// 

// finally, start
stream.pipe(csvStream);