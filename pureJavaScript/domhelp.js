/* DOM help utilities */
var DOMhelp = {

      addEvent: function(elem, evType, fn, useCapture) {
            if(elem.addEventListener) {
               return elem.addEventListener(evType, fn, useCapture);
            } else if(elem.attachEvent) {
               var r = elem.attachEvent('on'+evType,fn);
               return r;
            } else {
               elem['on'+evType] = fn;
            }
      },

      getTarget: function(e) {

           var target = window.event ? window.event.srcElement : e ? e.target : false;

           while(target.nodeType != 1 && target.nodeName.toLowerCase() != 'body') {

                 target = target.parentNode;
           } 
           if(!target) {return false;}

        return target;
      },

      cancelClick: function(e) {
           if(window.event) {
               window.event.returnValue = false;
               window.event.cancelBubble = true;
           }
           if(e && e.stopPropagation && e.preventDefault) {
               e.stopPropagation();
               e.preventDefault();
           }
      }  
};

Array.prototype.each = function(fn, thisfn){
      for(var index=0;index<this.length;index++) {
              fn.call(thisfn||null,this[index],index,this);
      } 
}