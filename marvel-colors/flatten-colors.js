var colors = require('./colors.json'),
    d3     = require('d3'),
    fs     = require('fs'),
    csv    = require('fast-csv');

/*
  This function calculate the most similar
  color to one of the colors provided.
  It takes a hex string as arguments
  colors is an object where key are labels and value are corresponding hex:
  {
    "AliceBlue": "#F0F8FF"}
  @return a dict {v, name}
*/
function nearest(color) {
  function qlab(c1,c2) {
    return (c2.l - c1.l)*(c2.l - c1.l) + (c2.a - c1.a)*(c2.a - c1.a) + (c2.b - c1.b)*(c2.b - c1.b)
  }

  var d = 0, // distance
      min_d = Infinity, // minimal distance
      k = ""; // the nearest key

  for(var i in colors){
    d = qlab(d3.lab(colors[i]),d3.lab(color));
    if( d < min_d ){
      min_d = d;
      k = i;
    }
  }
  return {
    value: colors[k],
    name: k
  };
}



console.log(nearest('#00cc00'));

// read covers.tsv
var stream = fs.createReadStream("covers.tsv"),
    cols   = ['couleur1', 'couleur2', 'couleur3', 'couleur4', 'couleur5'],//column names
    comics = [];

var csvStream = csv({delimiter: '\t', headers: true})
    .transform(function(data){
      for( var i in cols){ // calculate nearest color for each cell
        var nearest_color = nearest(data[cols[i]])
        data['flatten_' + cols[i]] = nearest_color.value;
        data['name_flatten_' + cols[i]] = nearest_color.name;
      }
      return data;
    })
    .on("data", function(data){
      comics.push(data);
    })
    .on("end", function(){
      console.log("done reading csv, start adding 'flat' colors for", comics.length, "lines");
      csv
        .writeToPath("covers.transformed.csv", comics, {
          headers: true
        })
       .on("finish", function(){
          console.log("transformation done! ... calculating top colors");
          // get top n colors
          var comics_colors = {},
              comics_colors_sortable = [];
              console.log(comics[0]);
          for(var i in comics) {
            for(var j in cols) {
              if(!comics_colors[comics[i]['flatten_' + cols[j]]]) {
                comics_colors[comics[i]['flatten_' + cols[j]]] = 0; 
              }
              comics_colors[comics[i]['flatten_' + cols[j]]] += 1;
            }
          }

          for(var i in comics_colors) {
            comics_colors_sortable.push({color: i, count: comics_colors[i]});
          }
          console.log("calculating top colors done! saving in csv file ...");
          csv
            .writeToPath("covers.topcolors.csv", comics_colors_sortable, {
              headers: true
            }).on("finish", function(){
              console.log("done, everything is ok");
            });


       });
    });

stream.pipe(csvStream);



