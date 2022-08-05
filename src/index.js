// L is L

var player;
var selected_track;
var vehicleMarker;

var regular_style = {
  stroke: true,
  color: 'red',
  weight: 3
};

var mouseover_style = {
  stroke: true,
  color: 'yellow',
  weight: 4
};

var onclick_style = {
  stroke: true,
  color: 'blue',
  weight: 4
};

async function html5video(div_id='vplayer', video_link){
  var video = document.createElement('video');
  video.className = 'videop'
  video.src = video_link;
  video.type = 'video/mp4';
  video.controls = true;
  video.playsinline = true;
  video.height = 190;
  video.width = 320;
  video.muted = true;

  // var player = document.createElement("div")
  // player.setAttribute("id", "vplayer");
  var player = document.getElementById(div_id)
  player.innerHTML = '';
  player.appendChild(video);
  
  video.play();
  return video;
}

function findPosOnTrack(pos, track) {
  var min=9999999, pos_time;
  for(let i=0; i<track.length-1;i++){
    let tpos =  L.latLng(track[i][1], track[i][0]);
    let tposd = tpos.distanceTo(pos);
    if(tposd < min){
      min = tposd;
      pos_time = track[i][2]; 
    }
    }
  return pos_time;
}

function findCTOnTrack(ct, trackords){
  // let trackords = track.geometry.coordinates;
  let i;
  for(i=0; i<trackords.length-1;i++){
    if(ct*1000 <= trackords[i][2]){
      return L.latLng(trackords[i][1], trackords[i][0]);
    }
  }
  return L.latLng(trackords[i][1], trackords[i][0]);
}

function youtube_parser(url){
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  return (match&&match[7].length==11)? match[7] : false;
}

function onPlayerReady(event) {
  event.target.playVideo();
}

var done = false;
function onPlayerStateChange(event) {
  console.log(player.playerInfo.currentTime); 
  console.log(event);
  if (event.data == YT.PlayerState.PLAYING && !done) {
    // setTimeout(stopVideo, 6000);
    done = true;
  }
  // playMarker();
}

function stopVideo() {
  player.stopVideo();
}

function playMarker(track, videoUrl) {
    var pf = setInterval(async function(){
      if(player.playerInfo == 'function'){
        var videoSrc = player.playerInfo.videoUrl;
        // console.log(videoUrl, videoSrc);
        if(videoUrl != videoSrc){
          console.log('somehting wrong track src and json url');
          clearInterval(pf);
        }
        let ppos = await findCTOnTrack(player.playerInfo.currentTime, track);
        if(vehicleMarker == undefined){
          vehicleMarker = L.marker(ppos).addTo(map);
        }
        vehicleMarker.setLatLng(ppos);        
      }
      else if(player.type == 'video/mp4' || 'video/ogg' || 'video/webm'){
        var videoSrc = player.currentSrc;
        // console.log(videoUrl, videoSrc);
        if(videoUrl != videoSrc){
          console.log('somehting wrong track src and json url');
          clearInterval(pf);
        }
        let ppos = await findCTOnTrack(player.currentTime, track);
        if(vehicleMarker == undefined){
          vehicleMarker = L.marker(ppos).addTo(map);
        }
        vehicleMarker.setLatLng(ppos);
      }
      else{
        console.log('seems video src not set up yet');
      }

    }, 1000);
}

L.videoTrack = L.VectorGrid.extend({

    // constructor function
    initialize: function (lineString, options) {
        this.lineString = lineString;
        this.selected_track = undefined;
        L.setOptions(this, options);
        
        // this.regular_style = options.regular_style;
        // this.mouseover_style = options.mouseover_style;
        // this.onclick_style = options.onclick_style;

        this.regular_style = {
          stroke: true,
          color: 'red',
          weight: 3
        },
        
        this.mouseover_style = {
          stroke: true,
          color: 'yellow',
          weight: 4
        },
        
        this.onclick_style = {
          stroke: true,
          color: 'blue',
          weight: 4
        }
    },

    drawTrack: function(lineString) {
      console.log('drawing now', lineString);
      var vectorGrid = L.vectorGrid.slicer(lineString, {
        maxZoom: 18,
        rendererFactory: L.svg.tile,
        vectorTileLayerStyles: {
          sliced: function(properties, zoom) {
            return {
              stroke: true,
              color: 'red',
              weight: 4
            }
          }
        },
        interactive: true,
        getFeatureId: function(f) {
          return f.properties.id;
        }
      })
      .on('click', async function(e){
        var properties = e.layer.properties;
        if(this.selected_track){
          console.log(this.selected_track);
          this.setFeatureStyle(this.selected_track, this.regular_style);
        }
        this.selected_track = properties['id'];
        const l = findPosOnTrack(e.latlng, properties.track);
        this.setFeatureStyle(this.selected_track, this.onclick_style);
        if(player==undefined){
          if(e.layer.properties.video.url == undefined){
            alert('Video link not added yet!');
            return;
          }
          let video_link = e.layer.properties.video.url;
          console.log(video_link);
          let video_id = youtube_parser(video_link);
          if(e.layer.properties.video.source="youtube" && video_id){
            player = new YT.Player('vplayer', {
              height: '390',
              width: '640',
              videoId: video_id,
              playerVars: {
                'playsinline': 1,
                'start': Math.floor(l/1000)
              },
              events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
              }
            });
            console.log(player);
            player.addEventListener('onReady', playMarker(e.layer.properties.track, player.playerInfo.videoUrl));
          }
          else if (e.layer.properties.video.source='html5'){
            player = await html5video('vplayer', video_link);
            console.log(player, player.src, 'clicked');
            player.addEventListener('onplay', playMarker(e.layer.properties.track, player.src));
          }
        }
        else if(typeof player.seekTo === 'function'){
          player.seekTo(Math.floor(l/1000));
        }
        else if(e.layer.properties.video.source = 'html5'){
          player.currentTime = Math.floor(l/1000);
        }
        else{
          console.log('click doing nothing')
        }
      })
      .on('mouseover', function(e) {
        var properties = e.layer.properties;
        L.popup()
                    .setContent(properties.id)
                    .setLatLng(e.latlng)
                    .openOn(map);
        console.log(this.selected_track, properties['id']);
        if(this.selected_track != properties['id']){
          console.log("mouse over");
          console.log(this);
          this.setFeatureStyle(properties['id'], this.mouseover_style);
        }
      })
      .on('mouseout', function(e) {
        var properties = e.layer.properties;
        if(this.selected_track != properties['id']){
          vectorGrid.resetFeatureStyle(properties['id']);
        }
      })
      // .addTo(map);
      // map.fitBounds(L.geoJSON(lineString).getBounds());
      // console.log(vectorGrid);
      return vectorGrid;
    },

    addTrack: function() {
        return drawTrack(this.lineString);
    },
})

function drawTrack(lineString){
    console.log('drawing now', lineString);
    var vectorGrid = L.vectorGrid.slicer(lineString, {
      maxZoom: 18,
      rendererFactory: L.svg.tile,
      vectorTileLayerStyles: {
        sliced: function(properties, zoom) {
          return {
            stroke: true,
            color: 'red',
            weight: 4
          }
        }
      },
      interactive: true,
      getFeatureId: function(f) {
        return f.properties.id;
      }
    })
    .on('click', async function(e){
      var properties = e.layer.properties;
      if(selected_track){
        vectorGrid.setFeatureStyle(selected_track, regular_style);
      }
      selected_track = properties['id'];
      const l = findPosOnTrack(e.latlng, properties.track);
      vectorGrid.setFeatureStyle(selected_track, onclick_style);
      if(player==undefined){
        if(e.layer.properties.video.url == undefined){
          alert('Video link not added yet!');
          return;
        }
        let video_link = e.layer.properties.video.url;
        let video_id = youtube_parser(video_link);
        if(e.layer.properties.video.source="youtube" && video_id){
          player = new YT.Player('vplayer', {
            height: '390',
            width: '640',
            videoId: video_id,
            playerVars: {
              'playsinline': 1,
              'start': Math.floor(l/1000)
            },
            events: {
              'onReady': onPlayerReady,
              'onStateChange': onPlayerStateChange
            }
          });
          console.log(player);
          player.addEventListener('onReady', playMarker(e.layer.properties.track, player.playerInfo.videoUrl));
        }
        else if (e.layer.properties.video.source='html5'){
          player = await html5video('vplayer', video_link);
          console.log(player, player.src, 'clicked');
          player.addEventListener('onplay', playMarker(e.layer.properties.track, player.src));
        }
      }
      else if(typeof player.seekTo === 'function'){
        player.seekTo(Math.floor(l/1000));
      }
      else if(e.layer.properties.video.source = 'html5'){
        player.currentTime = Math.floor(l/1000);
      }
      else{
        console.log('click doing nothing')
      }
    })
    .on('mouseover', function(e) {
      var properties = e.layer.properties;
      L.popup()
                  .setContent(properties.id)
                  .setLatLng(e.latlng)
                  .openOn(map);
      if(selected_track != properties['id']){
        console.log(vectorGrid);
        vectorGrid.setFeatureStyle(properties['id'], mouseover_style);
      }
    })
    .on('mouseout', function(e) {
      var properties = e.layer.properties;
      if(selected_track != properties['id']){
        vectorGrid.resetFeatureStyle(properties['id']);
      }
    })
    // .addTo(map);
    // map.fitBounds(L.geoJSON(lineString).getBounds());
    // console.log(vectorGrid);
    return vectorGrid;
  }


L.videoTrack.addTrack = function(lineString, options) {
    var res = new L.videoTrack(lineString, options);
    return res.addTrack();
}