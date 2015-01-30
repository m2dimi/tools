var sandcrawler = require('sandcrawler'),
    logger      = require('sandcrawler-logger'),  
    artoo       = require('artoo-js'),
    fs          = require('fs');

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
var details = [];

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

  .urls([
    'http://www.imdb.com/title/tt1014759/',
    'http://www.imdb.com/title/tt0363771/'
  ])

  .use(throttle({
    wait: 5367
  }))

  .jawascript(function(done) {
    var data = artoo.scrape('#title-overview-widget', {
      title: {
        sel:'h1 .itemprop[itemprop=name]'
      },
      original_title: {
        sel: 'h1 .title-extra[itemprop=name]',
        method: function() {
          return artoo.$(this).text().trim();
        }
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
    console.log(arguments)
    if(!err)
        details = details.concat(res.data);
      else
        req.retry();
  });

sandcrawler.run(film, function(err, remains) {
  console.log(details);
  console.log('done. Good job guy!');
});