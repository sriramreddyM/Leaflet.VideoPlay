# Leaflet.VideoMaps

A leaflet plugin for adding videos with GPS tracks to the map.

#### It will support,

- Interactive videotrack on map with Location and Timestamp synchronised.
- Supports video embeddings from Youtube and other custom hosts.

### Usage,

```Javascript
<script src="https://unpkg.com/leaflet.videomaps@1.1.1/dist/Leaflet.VideoMaps.js"></script>

fetch('./sample.json')
    .then(result => result.json())
    .then((output) => {
        var addedTrack = L.VideoMaps.drawTrack(output, "div_element").addTo(map);
    })
    .catch(err => console.error(err));

```

## Demo

1. Basic usecase: [https://sriramreddym.github.io/Leaflet.VideoMaps/dist/](https://sriramreddym.github.io/Leaflet.VideoMaps/dist/)
2. Add video by default: [https://sriramreddym.github.io/Leaflet.VideoMaps/dist/addVideoByDefault.html](https://sriramreddym.github.io/Leaflet.VideoMaps/dist/addVideoByDefault.html)

### Todo list

- [ ] Custom icon for marker
- [ ] Node.js package
