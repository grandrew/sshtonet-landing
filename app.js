/*global $, Auth0Lock, AUTH0_CLIENT_ID, AUTH0_DOMAIN, localStorage*/

$(document).ready(function() {

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

  $('.btn-logout').click(function(e) {
    e.preventDefault();
    logout();
  });
  
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
        }
        // Display user information
        show_profile_info(profile);
      });
    }
  };
  
  var get_port = function(e) {
    var mID = parseInt(e.target.id);
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
            $("#"+mID+"comp").text(mID+":"+response.port);
          }
        });
  };
  
  var refresh_machines = function() {
    var profile = JSON.parse(localStorage.getItem('profile'));
    $("#comps").html("");
    var id_token = localStorage.getItem('id_token');
    $.ajax({
          url: "https://sshto.net/"+profile.email+"?token="+id_token,
          jsonp: "callback",
          dataType: "jsonp",
          success: function( response ) {
            console.log( response ); // server response
            for(var i=0; i<response.IDs.length; i++) {
              $("#comps").append(' <a href="#" rel="nofollow" class="button text-button -secondary" id="'+response.IDs[i]+'comp" style="font-family: monospace;"> '+response.IDs[i]+' </a>');
              $("#"+response.IDs[i]+"comp").click(get_port);
            }
          }
        });
  };

  var show_profile_info = function(profile) {
        var eml = JSON.parse(localStorage.getItem('profile')).email
        $(".youremail").text(eml);
        $("#login-button-auth2").hide();
        $("#login-button-auth").hide();
        $("#altlog").hide();
        $(".form").hide();
        $("#hostslist").show();
        $(".pretitle").text("Hi, "+profile.name+"!")
        
        refresh_machines();
  };

  var logout = function() {
    localStorage.removeItem('id_token');
    window.location.href = "/";
  };

  $('#refresh-machines').click(function(e) {
    e.preventDefault();
    refresh_machines();
  })

  retrieve_profile();
  setTimeout(retrieve_profile,3500);
});
