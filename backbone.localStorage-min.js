/**
 * Backbone localStorage Adapter
 * Version 1.1.0
 *
 * https://github.com/jeromegn/Backbone.localStorage
 */(function(e,t){typeof define=="function"&&define.amd?define(["underscore","backbone"],function(n,r){return t(n||e._,r||e.Backbone)}):t(_,Backbone)})(this,function(e,t){function n(){return((1+Math.random())*65536|0).toString(16).substring(1)}function r(){return n()+n()+"-"+n()+"-"+n()+"-"+n()+"-"+n()+n()+n()}return t.LocalStorage=window.Store=function(e){this.name=e;var t=this.localStorage().getItem(this.name);this.records=t&&t.split(",")||[]},e.extend(t.LocalStorage.prototype,{save:function(){this.localStorage().setItem(this.name,this.records.join(","))},create:function(e){return e.id||(e.id=r(),e.set(e.idAttribute,e.id)),this.localStorage().setItem(this.name+"-"+e.id,JSON.stringify(e)),this.records.push(e.id.toString()),this.save(),this.find(e)},update:function(t){return this.localStorage().setItem(this.name+"-"+t.id,JSON.stringify(t)),e.include(this.records,t.id.toString())||this.records.push(t.id.toString()),this.save(),this.find(t)},find:function(e){return this.jsonData(this.localStorage().getItem(this.name+"-"+e.id))},findAll:function(){return e(this.records).chain().map(function(e){return this.jsonData(this.localStorage().getItem(this.name+"-"+e))},this).compact().value()},destroy:function(t){return t.isNew()?!1:(this.localStorage().removeItem(this.name+"-"+t.id),this.records=e.reject(this.records,function(e){return e===t.id.toString()}),this.save(),t)},destroyList:function(){this.localStorage().setItem(this.name,"")},localStorage:function(){return localStorage},jsonData:function(e){return e&&JSON.parse(e)}}),t.LocalStorage.sync=window.Store.sync=t.localSync=function(n,r,i){var s=r.localStorage||r.collection.localStorage,o,u,a=$.Deferred&&$.Deferred();try{switch(n){case"read":o=r.id!=undefined?s.find(r):s.findAll(),o&&o.constructor==Array&&o.length>0&&(o=r[i.add?"add":"reset"](r.parse(o,i)));var f=i.success;i=e.extend({forceRemote:!0},i),i.success=function(e,t,n){t.objects||(t={objects:t});if(e.models)e[n.add?"add":"reset"](e.parse(t,n)),s.destroyList(),e.forEach(function(e){e.save()}),f&&f(e,t,n);else{if(!e.set(e.parse(t,n)))return!1;s.destroy(e),e.save(),f&&f(e,t,n)}},t.sync(n,r,i);break;case"create":o=s.create(r);break;case"update":o=s.update(r);break;case"delete":o=s.destroy(r)}}catch(l){l.code===DOMException.QUOTA_EXCEEDED_ERR&&window.localStorage.length===0?u="Private browsing is unsupported":u=l.message}return o&&o.constructor==Object?(r.trigger("sync",r,o,i),i&&i.success&&(t.VERSION==="0.9.10"?i.success(r,o,i):i.success(o)),a&&a.resolve(o)):(u=u?u:"Record Not Found",r.trigger("error",r,u,i),i&&i.error&&(t.VERSION==="0.9.10"?i.error(r,u,i):i.error(u)),a&&a.reject(u)),i&&i.complete&&i.complete(o),a&&a.promise()},t.ajaxSync=t.sync,t.getSyncMethod=function(e,n){return e.localStorage||e.collection&&e.collection.localStorage?n.forceRemote?t.ajaxSync:t.localSync:t.ajaxSync},t.sync=function(e,n,r){return t.getSyncMethod(n,r).apply(this,[e,n,r])},t.LocalStorage});