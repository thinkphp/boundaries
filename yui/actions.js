YUI().use('node','event-delegate','jsonp',function(Y) {

  /* flickr api key */
  var flickr_api_key = '4ef2fe2affcdd6e13218f5ddd0e2500d',
  /* geo planet api key */
      geoplanet_api_key = 'dE28hNrV34GDiruGoUMw0JqPSRFyCpnYZpdZSDwdGzN_Nis5gaZevZRJkfswvaxsqQ7w';

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

   function handleJSONP(data) {

                     if(data.place.has_shapedata == 1) {

                            Y.each(data.place.shapedata.polylines.polyline,function(polyline, index){

                                   thepoints = [];
                                   
                                   Y.each(polyline._content.split(/ /),function(point, pindex){

                                          var lat = parseFloat(point.split(/,/)[0]),
                                              lng = parseFloat(point.split(/,/)[1]);
                                          thepoints[pindex] = new GLatLng(lat, lng); 
                                   });   

                                   var polyOptions = {geodesic: true};

                                   var colour = colours.shift();

                                   var name = data.place.name.split(',')[0];

                                   var polygon = new GPolygon(thepoints, colour, 5, 1, colour, 0.2, polyOptions);

                                       gmap.addOverlay(polygon);

                                   Y.one('#legend ul.legend-items').append('<li><div class="colour" style="background-color:'+ colour +'"></div><a href="#'+data.place.woeid+'">'+name+'</a></li>');

                                   Y.each(thepoints,function(point, pindex){

                                          bounds.extend(point);
                                   });

                            });

                            if(!bounds.isEmpty()) {

                                gmap.setCenter(bounds.getCenter(), gmap.getBoundsZoomLevel(bounds));   
                            }

                     }
   } 

   function displayPolygon(woeid) {             

            Y.jsonp('http://api.flickr.com/services/rest/?method=flickr.places.getInfo&api_key=' + flickr_api_key + '&woe_id=' + woeid + '&format=json&jsoncallback={callback}',handleJSONP); 
            
   }//end function displayPolygon


   function handleJSONP2(data) {

            Y.each(data.places.place,function(place, index){

                 displayPolygon(place.woeid);

            });
   }//end function 


   function resetMap(woeid) {

       bounds = new GLatLngBounds();

       colours = ["red", "blue", "green", "purple", "orange", "yellow", "darkred", "darkblue", "darkgreen","#6d4550","#73cdb3","#f1d6fe","#d3de76"];

       gmap.clearOverlays();

       Y.one('#legend ul.legend-items').set('innerHTML','');
       
       if(Y.one('#show-neighbourhood').get('checked') == true) {
             displayNeighbors(woeid); 
       } 
    
       displayPolygon(woeid);  
   };


   function displayNeighbors(woeid) {

          Y.jsonp('http://where.yahooapis.com/v1/place/'+woeid+'/neighbors?appid='+geoplanet_api_key+'&format=json&callback={callback}',handleJSONP2);

   }//end function displayNeighbourhood


   function handleJSONP3(data) {

          if(data.places.place[0]) {
                      var new_woeid = data.places.place[0].woeid;
                      resetMap(new_woeid);   
          } else {
                      alert("could't find any place!");
                      return false
          }                 
   }

   var handleSubmit = function(e){

          var location = Y.one('#neighbourhood-field').get('value');

              location = encodeURIComponent(location);  
          
          Y.jsonp('http://where.yahooapis.com/v1/places.q(' + location + ')?appid='+geoplanet_api_key+'&format=json&callback={callback}', handleJSONP3);

          window.location.hash = location;

      if(e) {e.preventDefault();}
   }

   Y.on('submit',handleSubmit,'#neighbourhood-search');


   Y.delegate('click',function(e){
         e.preventDefault();
         var new_location = this.get('text');
         var woeid = e.target.get('href').split('#')[1];
         resetMap(woeid);
         Y.one('#neighbourhood-field').set('value',new_location);
         window.location.hash = new_location;  

   },'#legend','a');

   if(window.location.hash) {

     var new_location = window.location.hash;
     var str = new_location.slice(1,new_location.length);   
     Y.one('#neighbourhood-field').set('value',str);
     handleSubmit();

   } else {

    Y.one('#neighbourhood-field').set('value','Bucharest');
    displayPolygon('868274');
    displayNeighbors('868274');

   }
});