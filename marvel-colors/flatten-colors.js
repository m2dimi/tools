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
  return colors[k];
}

console.log(nearest('#00cc00'));

// read covers.tsv
var stream = fs.createReadStream("covers.tsv"),
    comics = [];

var csvStream = csv({delimiter: '\t', headers: true})
    .transform(function(data){
      data['flatten_couleur1'] = nearest(data.couleur1);
      data['flatten_couleur2'] = nearest(data.couleur2);
      data['flatten_couleur3'] = nearest(data.couleur3);
      data['flatten_couleur4'] = nearest(data.couleur4);
      data['flatten_couleur5'] = nearest(data.couleur5);
      
      return data;
    })
    .on("data", function(data){
      comics.push(data);
    })
    .on("end", function(){
      console.log("done reading, start writing ...", comics.length);
      csv
        .writeToPath("covers.transformed.tsv", comics, {
          headers: true
        })
       .on("finish", function(){
          console.log("done!");
       });
    });

stream.pipe(csvStream);



