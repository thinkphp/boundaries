//show me love to the Module Pattern
var boundaries = (function() {

  /* get your own keys */
  /* Define flickr API key */
  var flickr_api_key = '4ef2fe2affcdd6e13218f5ddd0e2500d',
  /* Define geoplanet API key */
      geoplanet_api_key = 'zPWOoirV34HbvUcpmxC_vZml3lnUXjKXQOgJUDu2.gnYwT9a3IIHzRqiLyI56B0l',
  /* define gmap var */
      gmap,
  /* define bouds var */
      bounds,
  /* define an array of colours */
      colours = ["red", "blue", "green", "purple", "orange", "yellow", "darkred", "darkblue", "darkgreen", "aqua", "magenta", "springgreen"],
  /* an object */
      events = {};

  /*
   *
   * Usage: gmap.addMapType(getOSMapType());
   * @private 
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

  /** Get element by ID
    * @param id (String) mandatory - id of the Element
    * @return (Object) return an element with that ID
    * @private
    */
  function $(id) {return document.getElementById(id);}  

  /**
    * Get element by class name
    *
    * @param searchClass (String) mandatory name of the class by which search elements
    * @param node (String) optional name of the node within search elements
    * @param tag (String) optional name of the tags by which you make search
    * @return (array of HTMLElement) return an array of elements HTMLElement that they have attribute className specified.
    * @private
    */
  function $$(searchClass,node,tag) {

           var arr = [];
           if(node == null) {node = document;}
           if(tag == null) {tag = "*";}
           var elems = $(node).getElementsByTagName(tag);
           var n = elems.length;
           var pattern = new RegExp('(^|\\s)'+searchClass+'(\\s|$)');  
           for(var i=0;i<n;i++) {
               if(pattern.test(elems[i].className)) {
                    arr.push(elems[i]);
               }  
           }
     return arr;
  }

  /*
   * init function
   * @public
   */
  function init() {

              //create an object of GMap2
              gmap = new GMap2(document.getElementById('map'));

              //add the control to the map
              gmap.addControl(new GSmallMapControl());
 
              //add the control the the map
              gmap.addControl(new GMapTypeControl());

              //create an object point of GLatLng
              var startingPoint = new GLatLng(44.4492283, 26.1069228);

              //add open street map type
              gmap.addMapType(getOSMapType());

              //set center 
              gmap.setCenter(startingPoint, 13); 

              //create an object GLatLngBounds for set smart center 
              bounds = new GLatLngBounds();

              //inially , if we have hash then 
              //trigger handler for 'submit' event 
              //with value on window hash
              if(window.location.hash) {

                 var new_location = window.location.hash;
                 var str = new_location.slice(1,new_location.length);   
                 $('neighbourhood-field').value = str;
                 fire('submit'); 

              //otherwise display by default 'bucharest' 
              } else {

                 $('neighbourhood-field').value = 'Bucharest';
                 displayPolygon('868274');
                 displayNeighbors('868274');
              }
   }//end function init

   /**
     * Callback function from service that pass the necessary data.
     *
     * @param Object data - passed data from service
     * @return none; display map with polygon and sets center with bounds
     */
   function handleJSONP(data) {
                     if(window.console) {console.log(data);}

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

                              var legend = $$('legend-items','legend')[0];
                              legend.innerHTML = (legend.innerHTML+'<li><div class="colour" style="background-color:'+ colour +'"></div><a href="#'+data.place.woeid+'">'+name+'</a></li>');

                              thepoints.each(function(point,pindex){
                                          bounds.extend(point);
                              });
                              
                              if(!(bounds.length == 0)) {
                                  gmap.setCenter(bounds.getCenter(), gmap.getBoundsZoomLevel(bounds));   
                              }

                      }//end if


   }//end function handleJSONP

   /**
     * Display polygon by WOEID calling API
     * flickr services for bounds
     *
     * @param woeid (integer) where on earth ID 
     * @return none. display polygon by woeid
     */
   function displayPolygon(woeid) {

            LazyLoad.js('http://api.flickr.com/services/rest/?method=flickr.places.getInfo&api_key=' + flickr_api_key + '&woe_id=' + woeid + '&format=json&jsoncallback=boundaries.handleJSONP',function(data){if(window.console){console.log('loaded json');}}); 

   }//end function displayPolygon

   //callback function from service geoplanet that 
   //contains the necessary data woeid 
   //to display the polygons.
   function handleJSONP2(data) {

                   data.places.place.each(function(place,index){
                        displayPolygon(place.woeid);
                   });

   }//end function handleJSONP2

   //function to display neighbourhood.
   function displayNeighbors(woeid) {

          LazyLoad.js('http://where.yahooapis.com/v1/place/'+woeid+'/neighbors?appid='+geoplanet_api_key+'&format=json&callback=boundaries.handleJSONP2',function(){if(window.console) {console.log('loaded JS');}});
   }

    /* handler for 'submit' event; */
    //@param e (Object) event when clicked.
    //@return none.
    function handleSubmit(e) {

          var location = $('neighbourhood-field').value;

              location = encodeURIComponent(location);  
          
          LazyLoad.js('http://where.yahooapis.com/v1/places.q(' + location + ')?appid='+geoplanet_api_key+'&format=json&callback=boundaries.handleJSONP3',function(){if(window.console){console.log('loaded json');}});

          window.location.hash = location;

          DOMhelp.cancelClick(e); 

    }//end function handleSubmit
  
    //get form Element with ID 'neighbourhood-search'
    var form = $('neighbourhood-search');

    //attach an handler for 'submit' event
    DOMhelp.addEvent(form,'submit', handleSubmit, false);

    //callback function from service geoplanet that 
    //contains the necessary data to display the polygons and reset map.
    function handleJSONP3(data){

                    if(data.places.place[0]) {
                      var new_woeid = data.places.place[0].woeid;
                      resetMap(new_woeid);   
                    } else {
                      alert("could't find any place!");
                    }
    }
  
    /*
     * Reset map with new the woeid. 
     * Algorithm is simple: get container by id 'legend' and make it empty,
     * clear all the overlays , test if we the checkbox is true to know 
     * if we display neighbour or not and call the function displayPolygon 
     * with an woeid.
     *
     * @param (Integer) woeid
     * @return none. reset map with new polygons
     *
     */
    function resetMap(woeid) {

       //create again an object GLatLngbounds car map is reseted.
       bounds = new GLatLngBounds();

       //create again a vector of colours.
       colours = ["red", "blue", "green", "purple", "orange", "yellow", "darkred", "darkblue", "darkgreen","#6d4550","#73cdb3","#f1d6fe","#d3de76"];

       //clear overlays
       gmap.clearOverlays();

       //grag UL from container DIV with ID 'legend'; 
       $$('legend-items','legend')[0].innerHTML = "";

       //if the checkbox is clicked ie true then display the neighbourhood
       if($('show-neighbourhood').checked == true) {
             displayNeighbors(woeid); 
       } 
    
       //call displayPolygon with this parameter WOEID
       displayPolygon(woeid);  
    }

   /**
     * Use Event Delegation to add handlers to all the 
     * neighbourhood( <a href="#woeid">name of the neibourhood</a>) in DIV 'legend'. 
     * 
     * @param $('legend') (HTMLElement) name of the container for neighbourhood
     * @param 'click' (String) name of the event   
     * @param handler for click Function    
     * call DOM.addEvent with this parameters.
     *
     */
   DOMhelp.addEvent($('legend'),'click',function(event){
         var target = DOMhelp.getTarget(event);
         if(target.nodeName.toLowerCase() == 'a' && 
                  target.parentNode.nodeName.toLowerCase() == 'li') {
              var new_location = target.innerHTML;
                  hash = target.hash;
                  woeid = parseInt(hash.slice(1,hash.length));
                  resetMap(woeid);
                  $('neighbourhood-field').value = new_location;
                  window.location.hash = new_location;  
         }
     DOMhelp.cancelClick(event);
   },false);

   /**
     * Function that adds handler to the object that initial is empty events = {}
     *
     * @param e (String) - mandatory name of the event ('click','focus','submit') end so on
     * @param fn (Function) - mandatory name of the function that handles the event.
     * @return none. attach to events object the event and the handler for this.
     */
   function on(e,fn) {
       events[e] = fn;
   }
 
  /*
   * Trigger an handler with its event when you want
   *
   * @param e (String) name of the event triggered.
   * @param args (String) arguments optional.
   * @return none. call the handler for its event.
   */
   function fire(e, args) {
      if(events[e]) {
         events[e](args); 
      } 
   }

   //add event submit with correspondending handler 
   //to the events handler (initial events = {} empty)
   on('submit',handleSubmit);

  //methods init, handleJSONP1, handleJSONP2, handleJSONP3 needs to be public
  return{init: init, handleJSONP: handleJSONP, handleJSONP2: handleJSONP2, handleJSONP3: handleJSONP3}
})();

//call init function
boundaries.init();