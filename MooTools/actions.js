window.addEvent('domready',function() {

  /* flickr api key */
  var flickr_api_key = '4ef2fe2affcdd6e13218f5ddd0e2500d',
      geoplanet_api_key = 'zPWOoirV34HbvUcpmxC_vZml3lnUXjKXQOgJUDu2.gnYwT9a3IIHzRqiLyI56B0l';                           
  /*
   *
   * Usage: gmap.addMapType(getOSMapType());
   *  
   */
  function getOSMapType() {
       var copyright = new GCopyrightCollection('<a href="http://www.openstreetmap.org/" class="copyright">OpenStreetMap</a>');
           copyright.addCopyright(new GCopyright(1, 
                                                 new GLatLngBounds(new GLatLng(-90, -180),new GLatLng(90, 180)),
                                                 0, ' '));
       var tileLayer = new GTileLayer(copyright, 7, 18, {tileUrlTemplate: 'http://b.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/998/256/{Z}/{X}/{Y}.png', isPng: true, opacity: 1.0});
       var mapType = new GMapType([tileLayer], G_NORMAL_MAP.getProjection(), 'OSM');

    return mapType;
  }

   var gmap = new GMap2(document.getElementById('map'));
       gmap.addControl(new GSmallMapControl());
  	 gmap.addControl(new GMapTypeControl());
   var startingPoint = new GLatLng(44.4492283, 26.1069228);
       gmap.addMapType(getOSMapType());
       gmap.setCenter(startingPoint, 13); 

   var bounds = new GLatLngBounds();

   var colours = ["red", "blue", "green", "purple", "orange", "yellow", "darkred", "darkblue", "darkgreen", "aqua", "magenta", "springgreen"];

   function displayPolygon(woeid) {

            new Request.JSONP({
                callbackKey: 'jsoncallback', 
                url: 'http://api.flickr.com/services/rest/',
                data: {
                     method: 'flickr.places.getInfo',
                     api_key: flickr_api_key,
                     woe_id: woeid,
                     format: 'json' 
                },
                onComplete: function(data){

                     if(data.place.has_shapedata == 1) {

                        var polyline = data.place.shapedata.polylines.polyline[0]._content;
                            thepoints = [];
                            polyline.split(/ /).each(function(point, pindex){
                                var lat = parseFloat(point.split(/,/)[0]),
                                    lng = parseFloat(point.split(/,/)[1]);
                                    thepoints[pindex] = new GLatLng(lat, lng); 
                            });    

                          var polyOptions = {geodesic: true};
                          var colour = colours.shift();
                          var name = data.place.name.split(',')[0];
                          var polygon = new GPolygon(thepoints, colour, 5, 1, colour, 0.2, polyOptions);

                              gmap.addOverlay(polygon);

                              var legend = $$('.legend-items')[0];
                              legend.set('html',legend.get('html')+'<li><div class="colour" style="background-color:'+ colour +'"></div><a href="#'+data.place.woeid+'">'+name+'</a></li>');

                              thepoints.each(function(point,pindex){
                                          bounds.extend(point);
                              });
                              
                              if(!bounds.isEmpty()) {
                                  gmap.setCenter(bounds.getCenter(), gmap.getBoundsZoomLevel(bounds));   
                              }

                      }//end if
                }
            }).send();

   }//end function displayPolygon

   function resetMap(woeid) {

       bounds = new GLatLngBounds();

       colours = ["red", "blue", "green", "purple", "orange", "yellow", "darkred", "darkblue", "darkgreen","#6d4550","#73cdb3","#f1d6fe","#d3de76"];

       gmap.clearOverlays();

       $$('ul.legend-items')[0].empty();

       if($('show-neighbourhood').get('checked') == true) {
             displayNeighbors(woeid); 
       } 
    
       displayPolygon(woeid);  
   };

   $('neighbourhood-search').addEvent('submit',function(e) {
   
          if(e) {e.stop();}

          var location = $('neighbourhood-field').get('value');

              location = encodeURIComponent(location);  

              new Request.JSONP({

                  url: 'http://where.yahooapis.com/v1/places.q(' + location + ')',

                  data: {
                      appid: geoplanet_api_key,
                      format: 'json' 
                  },

                  onComplete: function(data){

                    if(data.places.place[0]) {
                      var new_woeid = data.places.place[0].woeid;
                      resetMap(new_woeid);   
                    } else {
                      alert("could't find any place!");
                    }                 

                  }
             }).send();
          
        window.location.hash = location;
   });


   function displayNeighbors(woeid) {

            new Request.JSONP({
                callbackKey: 'callback',
                url: 'http://where.yahooapis.com/v1/place/'+woeid+'/neighbors',
                data: {
                     appid: geoplanet_api_key,
                     format: 'json' 
                },
                onComplete: function(data){
                   data.places.place.each(function(place,index){
                        displayPolygon(place.woeid);
                   });
                }  
            }).send();
   }
   
  
   $('legend').addEvent('click',function(event){
         if(event.target.nodeName.toLowerCase() == 'a' && 
                  event.target.parentNode.nodeName.toLowerCase() == 'li') {
              var new_location = $(event.target).get('text'),
                  hash = event.target.hash,
                  woeid = parseInt(hash.slice(1,hash.length));
                  resetMap(woeid);
                  $('neighbourhood-field').set('value',new_location);
                  window.location.hash = new_location;  
         }
       return false;    
   });
  

  if(window.location.hash) {
     var new_location = window.location.hash;
     var str = new_location.slice(1,new_location.length);   
     $('neighbourhood-field').set('value',str);
     $('neighbourhood-search').fireEvent('submit');
  } else {
    $('neighbourhood-field').set('value','Bucharest');
    displayPolygon('868274');
    displayNeighbors('868274');
  }
  
});