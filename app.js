/*global $, Auth0Lock, AUTH0_CLIENT_ID, AUTH0_DOMAIN, localStorage*/

$(document).ready(function() {

  (function ($) {
      $.fn.wysiwygEvt = function () {
          return this.each(function () {
              var $this = $(this);
              var htmlold = $this.html();
              $this.bind('blur keyup paste copy cut mouseup', function () {
                  var htmlnew = $this.html();
                  if (htmlold !== htmlnew) {
                      $this.trigger('change')
                  }
              })
          })
      }
  })(jQuery);

  var lock = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN, {
    auth: {
      params: { scope: 'openid email' } //Details: https://auth0.com/docs/scopes
    },
    theme: {
      logo: "terminal_ico.png"
    },
    languageDictionary: {
      title: "Log in"
    }
  });
  
  var logout = function() {
    localStorage.removeItem('id_token');
    window.location.href = "/";
  };

  $('#login-button-auth').click(function(e) {
    e.preventDefault();
    lock.show();
  });
  
  $('#login-button-auth2').click(function(e) {
    e.preventDefault();
    lock.show();
  });
  
  $('#sginin-link').click(function(e) {
    e.preventDefault();
    lock.show();
  });
  $('#sginin-link2').click(function(e) {
    e.preventDefault();
    lock.show();
  });

  $('.btn-logout').click(function(e) {
    e.preventDefault();
    logout();
  });
  $(".termeditable").wysiwygEvt();
  $(".termeditable").change(function(e) {
      var login = $("#m-login").text();
      var name = $("#m-name").text();
      var mid = $("#m-id").text();
      if(parseInt(mid)) {
        var card_id = mid+"comp";
        $("#"+card_id+" .m-card-name").text(name);
        $("#"+card_id+" .m-card-user").text(login);
      }
  });
  
  var save_card = function (e) {
      var login = $("#m-login").text();
      var name = $("#m-name").text();
      var mid = $("#m-id").text();
      if(parseInt(mid)) {
        if(name.length == 0) name = "edit_me";
        if(login.length == 0) login = "edit_me";
        // TODO HERE: save profile by calling API
        // TODO HERE: update document.machine_cards too
        var new_ob = {"name": name, "user": login };
        var meta_id = mid+"comp";
        if(document.machine_cards[meta_id] && JSON.stringify(document.machine_cards[meta_id]) === JSON.stringify(new_ob) ) return;
        document.machine_cards[mid+"comp"] = new_ob;
        var id_token = localStorage.getItem('id_token');
        var eml = JSON.parse(localStorage.getItem('profile')).email;
        $.ajax({
              url: "https://sshto.net/profile/"+eml,
              jsonp: "callback",
              dataType: "jsonp",
              data: {
                "token": id_token,
                "metadata": JSON.stringify(document.machine_cards)
              }
        });
      }
  };
  
  $(".termeditable").blur(save_card);
  $(".termeditable").bind("enterKey", save_card);
  $(".termeditable").keypress(function(e){ return e.which != 13; });
  
  
  lock.on("authenticated", function(authResult) {
    lock.getProfile(authResult.idToken, function(error, profile) {
      if (error) {
        // Handle error
        return;
      }
      localStorage.setItem('id_token', authResult.idToken);
      localStorage.setItem('profile', JSON.stringify(profile));
      // Display user information
      console.log("Authorization");
      if(((new Date()).getTime() - Date.parse(profile.created_at)) < 3600000) {
        $('<iframe>', {
         src: 'thankyou.html',
         id:  'thankyouhtml',
         frameborder: 0,
         scrolling: 'no'
         }).appendTo(document.body);
      }
      show_profile_info(profile);
    });
  });
  
  $.ajaxSetup({
    'beforeSend': function(xhr) {
      if (localStorage.getItem('id_token')) {
        xhr.setRequestHeader('Authorization',
              'Bearer ' + localStorage.getItem('id_token'));
      }
    }
  });

  //retrieve the profile:
  var retrieve_profile = function() {
    var id_token = localStorage.getItem('id_token');
    if (id_token) {
      lock.getProfile(id_token, function (err, profile) {
        if (err) {
          console.log('There was an error getting the profile: ' + err.message);
          logout();
        }
        // Display user information
        show_profile_info(profile);
      });
    }
  };
  
  var get_port = function(mID) {
    // e.preventDefault();
    // var mID = parseInt(e.target.id);
    var profile = JSON.parse(localStorage.getItem('profile'));
    var id_token = localStorage.getItem('id_token');
    console.log("Machine ID "+mID);
    $.ajax({
          url: "https://sshto.net/"+profile.email+"/"+mID+"?token="+id_token,
          jsonp: "callback",
          dataType: "jsonp",
          success: function( response ) {
            console.log( response ); // server response
            $(".portcon").text(response.port);
            var card_id = mID+"comp";
            $("#"+card_id+" .m-card-port").text(response.port);
            $("#m-id").text(mID);
            $("#m-name").text($("#"+card_id+" .m-card-name").text());
            $("#m-login").text($("#"+card_id+" .m-card-user").text());
          }
        });
  };
  
  var create_get_port_call = function(mID) {
      return function(e) {e.preventDefault(); get_port(mID);};
  };
  
  var refresh_machines = function() {
    var profile = JSON.parse(localStorage.getItem('profile'));
    $("#idlist").html("");
    var id_token = localStorage.getItem('id_token');
    $.ajax({
          url: "https://sshto.net/"+profile.email+"?token="+id_token,
          jsonp: "callback",
          dataType: "jsonp",
          success: function( response ) {
            var mid;
            var max_nr = 1;
            console.log( response ); // server response
            for(var i=0; i<response.IDs.length; i++) {
              // $("#comps").append(' <a href="#" rel="nofollow" class="button text-button -secondary" id="'+response.IDs[i]+'comp" style="font-family: monospace;"> '+response.IDs[i]+' </a>');
              mid = response.IDs[i];
              var card_name = "name_edit_me";
              var card_user = "user_edit_me";
              var meta_id = mid+"comp";
              if(mid > max_nr) max_nr = mid;
              if(document.machine_cards && meta_id in document.machine_cards) {
                card_name = document.machine_cards[meta_id].name;
                card_user = document.machine_cards[meta_id].user;
              }
              $("#idlist").append('<a href="#" rel="nofollow" class="button text-button -secondary mcard" id="'+mid+'comp"> <div>'+mid+'</div><div><div class="m-card-name">'+card_name+'</div> <div>user: <span class="m-card-user">'+card_user+'</span></div><div>port: <span class="m-card-port"><span style="color: gray">click to update</span></span></div></div></a>');
              // $("#"+response.IDs[i]+"comp").click(get_port);
              var fc = create_get_port_call(mid);
              $("#"+mid+"comp").click(fc);
            }
            $(".machnr").text(max_nr+1);
          }
        });
  };

  var show_profile_info = function(profile) {
        // var eml = JSON.parse(localStorage.getItem('profile')).email;
        $(".youremail").text(profile.email);
        $("#login-button-auth2").hide();
        $("#login-button-auth").hide();
        $("#altlog").hide();
        $("#altlog2").hide();
        $(".form").hide();
        $(".signinfirst").hide();
        $(".promoblock").hide();
        $("#hostslist").show();
        $(".pretitle").text("Hi, "+profile.name+"!");
        
        var id_token = localStorage.getItem('id_token');
        $(".id_token").text(id_token);
        
        document.machine_cards = profile.user_metadata;
        if(! document.machine_cards) document.machine_cards = {};
        
        refresh_machines();
  };

  

  $('#refresh-machines').click(function(e) {
    e.preventDefault();
    refresh_machines();
  })

  retrieve_profile();
  setTimeout(retrieve_profile,3500);
  if(!$("#betaRibbon").length) $('<div class="ribbon" id="betaRibbon"><span>BETA</span></div>').appendTo(document.body);
});
