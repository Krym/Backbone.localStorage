/**
 * Backbone localStorage Adapter
 * Version 1.1.0
 *
 * https://github.com/jeromegn/Backbone.localStorage
 */
(function (root, factory) {
   if (typeof define === "function" && define.amd) {
      // AMD. Register as an anonymous module.
      define(["underscore","backbone"], function(_, Backbone) {
        // Use global variables if the locals are undefined.
        return factory(_ || root._, Backbone || root.Backbone);
      });
   } else {
      // RequireJS isn't being used. Assume underscore and backbone are loaded in <script> tags
      factory(_, Backbone);
   }
}(this, function(_, Backbone) {
// A simple module to replace `Backbone.sync` with *localStorage*-based
// persistence. Models are given GUIDS, and saved into a JSON object. Simple
// as that.

// Hold reference to Underscore.js and Backbone.js in the closure in order
// to make things work even if they are removed from the global namespace

// Generate four random hex digits.
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

// Our Store is represented by a single JS object in *localStorage*. Create it
// with a meaningful name, like the name you'd give a table.
// window.Store is deprectated, use Backbone.LocalStorage instead
Backbone.LocalStorage = window.Store = function(name, species) {
  this.name = name;
  this.species = (typeof species != "undefined") ? species : "";
};

_.extend(Backbone.LocalStorage.prototype, {

  // Save the current state of the **Store** to *localStorage*.
  save: function() {
    this.localStorage().setItem(this.name, this.records.join(","));
  },

  createList: function(collection) {
    this.localStorage().setItem(this.name + "#" + this.species, collection.pluck("id"));
  },

  // Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
  // have an id of it's own.
  create: function(model) {
    if (!model.id) {
      model.id = guid();
      model.set(model.idAttribute, model.id);
    }
    this.localStorage().setItem(this.name+"-"+model.id, JSON.stringify(model));
    //this.records.push(model.id.toString());
    //this.save();
    return this.find(model);
  },

  // Update a model by replacing its copy in `this.data`.
  update: function(model) {
    this.localStorage().setItem(this.name+"-"+model.id, JSON.stringify(model));
    // if (!_.include(this.records, model.id.toString()))
    //   this.records.push(model.id.toString()); this.save();
    return this.find(model);
  },

  // Retrieve a model from `this.data` by id.
  find: function(model) {
    return this.jsonData(this.localStorage().getItem(this.name+"-"+model.id));
  },

  // Return the array of all models currently in storage.
  findAll: function() {
    var store = this.localStorage().getItem(this.name + "#" + this.species);
    var records = (store && store.split(",")) || [];
    return _(records).chain()
      .map(function(id){
        return this.jsonData(this.localStorage().getItem(this.name+"-"+id));
      }, this)
      .compact()
      .value();
  },

  // Delete a model from `this.data`, returning it.
  destroy: function(model) {
    if (model.isNew())
      return false
    this.localStorage().removeItem(this.name+"-"+model.id);
    // this.records = _.reject(this.records, function(id){
    //   return id === model.id.toString();
    // });
    // this.save();
    return model;
  },

  destroyList: function() {
      this.localStorage().setItem(this.name + "#" + this.species, "");
  },

  localStorage: function() {
    return localStorage;
  },
  
  // fix for "illegal access" error on Android when JSON.parse is passed null
  jsonData: function (data) {
      return data && JSON.parse(data);
  }

});

// localSync delegate to the model or collection's
// *localStorage* property, which should be an instance of `Store`.
// window.Store.sync and Backbone.localSync is deprectated, use Backbone.LocalStorage.sync instead
Backbone.LocalStorage.sync = window.Store.sync = Backbone.localSync = function(method, model, options) {
  var store = model.localStorage || model.collection.localStorage;

  var resp, errorMessage, syncDfd = $.Deferred && $.Deferred(); //If $ is having Deferred - use it. 

  try {

    switch (method) {
      case "read":
        resp = model.id != undefined ? store.find(model) : store.findAll();

        //in case there is data in local storage, fill actuall collection with models found
        if (resp && resp.constructor == Array && resp.length > 0) {
          var method = options.update ? 'update' : 'reset';
          model[method](resp, options);
        }

        // fetch from remote server
        var success = options.success;
        options.success = function(model, response, options) {
          response = (!response.objects) ? response : response.objects;
          if (model.models) {     // is collection if contains models
            var method = options.update ? 'update' : 'reset';
            model[method](response, options);
            //store.destroyList();
            store.createList(model);
            model.forEach(function(m){
              m.save();
            });

            if (success) success(model, response, options);
          } else {                // is not a collection
            if (!model.set(response, options)) return false;

            //store.destroy(model);
            model.save();

            if (success) success(model, response, options);
          }
        }
        Backbone.ajaxSync(method, model, options);
        options.success = success;

        break;
      case "create":
        resp = store.create(model);
        break;
      case "update":
        resp = store.update(model);
        break;
      case "delete":
        resp = store.destroy(model);
        break;
    }

  } catch(error) {
    if (error.code === DOMException.QUOTA_EXCEEDED_ERR && window.localStorage.length === 0)
      errorMessage = "Private browsing is unsupported";
    else
      errorMessage = error.message;
  }

  //only objects are correct response, fix when local storage collection returns an empty array
  if (resp && (resp.constructor != Array || (resp.length > 0))) {
      model.trigger("lsync", model, resp, options);
      if (options && options.lsuccess)
        if (Backbone.VERSION === "0.9.10") {
          options.lsuccess(model, resp, options);
        } else {
          options.lsuccess(resp);
        }
      if (syncDfd)
        syncDfd.resolve(resp);
  } else {
    errorMessage = errorMessage ? errorMessage : "Record Not Found";
    
    model.trigger("lerror", model, errorMessage, options);
    if (options && options.error)
      if (Backbone.VERSION === "0.9.10") {
        console.log("error");
        options.error(model, errorMessage, options);
      } else {
        options.error(errorMessage);
      }
      
    if (syncDfd)
      syncDfd.reject(errorMessage);
  }
  
  // add compatibility with $.ajax
  // always execute callback for success and error
  if (options && options.complete) options.complete(resp);

  return syncDfd && syncDfd.promise();
};

Backbone.ajaxSync = Backbone.sync;

Backbone.getSyncMethod = function(model, options) {
  if(model.localStorage || (model.collection && model.collection.localStorage)) {
    return (!options.forceRemote) ? Backbone.localSync : Backbone.ajaxSync;
  }
  return Backbone.ajaxSync;
};

// Override 'Backbone.sync' to default to localSync,
// the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
Backbone.sync = function(method, model, options) {
  return Backbone.getSyncMethod(model, options).apply(this, [method, model, options]);
};

return Backbone.LocalStorage;
}));