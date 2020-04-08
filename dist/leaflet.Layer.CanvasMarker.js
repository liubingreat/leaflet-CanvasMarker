/*
 * Leaflet.layer.CanvasMarker 1.0.0,
 * 替换Dom Marker 提高性能
 * 开发者: 刘斌（540530096@qq.com）
 */
(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
   typeof define === 'function' && define.amd ? define(['exports'], factory) :
   (global = global || self, factory((global.leaflet = global.leaflet || {}, global.leaflet.Layer = global.leaflet.Layer || {}, global.leaflet.Layer.CanvasMarker = {})));
}(this, (function (exports) { 'use strict';

   var CanvasMarker = L.CanvasMarker = L.Path.extend({
           /**
            * 配置项  toLatLng
            */
           options: {
               /** 图片宽度(单位像素)*/
               iconWidth: 30,
               /** 图片高度(单位像素)*/
               iconHeight: 30,
               /** 图片横向偏移量*/
               iconOffsetX: 0,
               /** 图片纵向偏移量*/
               iconOffsetY: 0,
               /** 图片路径*/
               iconUrl: null,

               interactive : true
           },

           /**
            * 初始化
            */
           initialize: function (latlng, options) {
               L.Util.setOptions(this, options);
               this._latlng = toLatLng(latlng);
               this._iconWidth = this.options.iconWidth;
               this._iconHeight = this.options.iconHeight;
               this._iconOffsetX = this.options.iconOffsetX,
                   this._iconOffsetY = this.options.iconOffsetY,
                   this._iconUrl = this.options.iconUrl;
               this.labelPosition = null;
           },

           /**
            * 设置LatLng
            */
           setLatLng: function (latlng) {
               this._latlng = toLatLng(latlng);
               this.redraw();
               return this.fire('move', {latlng: this._latlng});
           },

           /**
   		 * 获取latlng
            * @returns {*}
            */
           getLatLng: function () {
               return this._latlng;
           },

           /**
   		 * 设置样式
            * @param options
            * @returns {*}
            */
           setStyle : function (options) {
               
               let iconWidth = options && options.iconWidth || this._iconWidth,
                   iconHeight = options && options.iconHeight || this._iconHeight,
                   iconUrl = options && options.iconUrl || this._iconUrl,
                   iconOffsetX = options && options.iconOffsetX || this._iconOffsetX,
                   iconOffsetY = options && options.iconOffsetY || this._iconOffsetY;
               L.Path.prototype.setStyle.call(this, options);
               this._iconWidth = iconWidth;
               this._iconHeight = iconHeight;
               this._iconOffsetX = iconOffsetX || 0;
               this._iconOffsetY = iconOffsetY || 0;
               this._iconUrl = iconUrl;
               this.options.interactive = true;
               return this.redraw();
           },


           /**
   		 * 坐标转换
            * @private
            */
           _project: function () {
               this._point = this._map.latLngToLayerPoint(this._latlng);
               this._updateBounds();
           },

           /**
   		 * 更新包围盒
            * @private
            */
           _updateBounds: function () {
               let w = this._iconWidth,
                   h = this._iconHeight,
                   ox = this._iconOffsetX,
                   oy = this._iconOffsetY,
                   t = this._clickTolerance(),
                   dp = new L.Point(w / 2 + t, h / 2 + t),
                   offset = new L.Point(ox, oy),
                   lefttop = this._point.add(offset).subtract(dp),
                   rightBottom = this._point.add(offset).add(dp);
                   var labelBox = null;
                   if(this.options.show == "1" && this.options.title) {
                       var fontSize = parseInt(this.options.fontSize),
                           title = this.options.title,
                           labelXOffset = parseInt(this.options.labelXOffset || 0),
                           labelYOffset = parseInt(this.options.labelYOffset || 0);
                       this.labelWidth = title.length * fontSize;
                       var labelLeftTop = this._point.add(L.point(labelXOffset, labelYOffset)),
                           labelRightBottom = this._point.subtract(L.point(labelXOffset, labelYOffset));
                       labelBox = new L.Bounds(labelLeftTop, labelRightBottom);
                       this.labelPosition = this._point.add(L.point(labelXOffset, labelYOffset));
                   }
                   var imgBox = null;
                   if(this.options.graphic) {
                       imgBox = new L.Bounds(lefttop, rightBottom);
                   }
                   if(labelBox && imgBox) {
                       this._pxBounds = labelBox.extend(imgBox.getTopRight()).extend(imgBox.getBottomLeft());
                   }else if(labelBox) {
                       this._pxBounds = labelBox;
                   }else {
                       this._pxBounds = imgBox;
                   }

           },

           /**
   		 * 更新layer
            * @private
            */
           _update: function () {
               if (this._map) {
                   this._updatePath();
               }
           },

           _updatePath: function () {
               this._renderer._updateCanvasMarker(this);
           },

           _empty: function () {
               return !this._renderer._bounds.intersects(this._pxBounds);
           },

           _containsPoint: function (p) {
               return this._pxBounds && this._pxBounds.contains(p);
           },

           setOpacity: function (opacity) {
               this.options.opacity = opacity;
               if (this._map) {
                   this.setStyle(this.options);
               }
               return this;
           },
           toGeoJSON: function(precision) {
   	        return L.GeoJSON.getFeature(this, {
   	            type: 'Point',
   	            coordinates: L.GeoJSON.latLngToCoords(this.getLatLng(), precision)
   	        });
   	    }

       });

       /**
   	 * 扩展leaflet Canvas渲染器
        */
       L.Canvas.include({
           /**
            * 绘制CanvasMarker图层
            * @param layer
            * @private
            */
           _updateCanvasMarker: function(layer) {
               if (!this._drawing || layer._empty()) { return; }
               let p = layer._point,
                   ctx = this._ctx,
                   url = layer._iconUrl,
                   w = layer._iconWidth,
                   h = layer._iconHeight,
                   ox = layer._iconOffsetX || 0,
                   oy = layer._iconOffsetY || 0;

               let img = new Image();
               //抗锯齿反走样
               img.onload = () => {
                   this._drawnLayers[layer._leaflet_id] = layer;
                   let dp = new L.Point(w / 2, h / 2),
                       offset = new L.Point(ox, oy),
                       xy = p.add(offset).subtract(dp);

                   let lastOpacity = ctx.globalAlpha,
                       opt = layer.options;
                   if(opt.opacity !== undefined) {
                       ctx.globalAlpha = opt.opacity;
                   } 
                   ctx.drawImage(img, xy.x,xy.y, w, h);
                   if(opt.show == "1" && opt.title) {
                       ctx.font = opt.fontSize + "px " + (opt.fontWeight || "bold" )+ " 微软雅黑";
                       ctx.strokeStyle = opt.fontColor;
                       ctx.textAlign = "center";
                       ctx.textBaseline = "middle";
                       ctx.fillStyle =  opt.fontColor;
                       // ctx.strokeText(opt.title, layer.labelPosition.x, layer.labelPosition.y, layer.labelWidth);
                       ctx.fillText(opt.title, layer.labelPosition.x, layer.labelPosition.y, layer.labelWidth);
                   }
                   ctx.globalAlpha = lastOpacity;
                   layer.fire("imgDrawEnd");
               };
               img.src = url;
           }
       });


      
       function toLatLng(a, b, c) {
           if (a instanceof L.LatLng) {
               return a;
           }
           if (L.Util.isArray(a) && typeof a[0] !== 'object') {
               if (a.length === 3) {
                   return new L.LatLng(a[0], a[1], a[2]);
               }
               if (a.length === 2) {
                   return new L.LatLng(a[0], a[1]);
               }
               return null;
           }
           if (a === undefined || a === null) {
               return a;
           }
           if (typeof a === 'object' && 'lat' in a) {
               return new L.LatLng(a.lat, 'lng' in a ? a.lng : a.lon, a.alt);
           }
           if (b === undefined) {
               return null;
           }
           return new L.LatLng(a, b, c);
       }

       L.Browser.retina  = true;
       L.CanvasMarker = CanvasMarker;

   exports.CanvasMarker = CanvasMarker;

   Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=leaflet.Layer.CanvasMarker.js.map
