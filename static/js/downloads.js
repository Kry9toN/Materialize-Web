// Global setup
const baseURL = "#";
const devicesURL = baseURL + "devices.json";
const deviceURL = codename => `${baseURL}builds/${codename}.json`;
const changelogURL = (build, codename) => `${baseURL}changelog/${codename}/${build.replace('zip', 'txt')}`;

const getToday = () => {
  let d = new Date();
  return `${d.getFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`
}

const downloadsCountURL = (build, codename) =>
  ``;


const toogleMenu = () => {
  var menu = document.getElementsByClassName("menu")[0];
  menu.style.display = menu.style.display == 'none' ? 'block' : 'none'
}

const request = (url, isJson = true) => {
  return fetch(url).then((res) => isJson ? res.json() : res.text()).catch((e) => console.log(e))
}

const humanSize = (bytes) => {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 Byte';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

const humanDate = (timestamp) => {
  let d = new Date(timestamp * 1000)
  let mm = ('0' + (d.getUTCMonth() + 1)).slice(-2)
  let dd = ('0' + d.getUTCDate()).slice(-2)
  return `${d.getFullYear()}/${mm}/${dd}`;
};


var app = new Vue({
  el: '#app',
  data: {
    brands: [],
    devices: [],
    deviceBuilds: [],
    device: [],
    codename: '',
    search: '',
    showBuild: null,
  },
  mounted(){

    this.suported();

    var url = new URL(window.location.href);
    var device = url.searchParams.get("device");
    var build = url.searchParams.get("build");

    if (device) {
      this.LoadBuilds(device);
      this.showBuild = build
    }
  
    // init collapsible
    let elems = document.querySelector('.collapsible');
    M.Collapsible.init(elems);
  
    // init sidenav
    let sidenav = document.querySelectorAll('.sidenav');
    M.Sidenav.init(sidenav);

  },
  computed: {
    filteredList() {
      return this.devices.filter(d => {
        var resByCodename = d.codename.toLowerCase().includes(this.search.toLowerCase())
        var resByName = d.name.toLowerCase().includes(this.search.toLowerCase())

        return !!resByName ? resByName : resByCodename
      })
    }
  },
  methods: {
    suported: function () {
      request(devicesURL)
        .then(response => {
          response.forEach(element => {
            if (this.brands.indexOf(element.brand) == -1) {
              this.brands.push(element.brand)
            }
            this.devices.push(element)

          });

          document.addEventListener('keypress', (event) => {
            if (event.keyCode == 13) {
              if (document.querySelector('.search-link') != null) {
                app.LoadBuilds(document.querySelector('.search-link').attributes['data-device'].value)
              }
            }

          });

        })
    },
    LoadDevice: function (codename) {
      request(devicesURL)
        .then(res => {

          device = res.filter((device) => device.codename == codename)[0]

          if (device) {
            this.device = device
            this.codename = device.codename
          }else{
            M.toast({html: `device '${codename}' not found`})
          }

        })
    },
    LoadBuilds: async function (codename) {

      this.LoadDevice(codename)
      this.deviceBuilds = [];

      history.pushState(null, '', `?device=${codename}`);

      if (this.search != '') {
        document.querySelectorAll('.wrapper')[0].style.display = 'none'
        document.querySelectorAll('input')[0].blur()
        this.search = ''
      }

      // init sidenav again
      let sidenav = document.querySelectorAll('.sidenav');
      M.Sidenav.init(sidenav);

      await request(deviceURL(codename))
        .then(res => this.deviceBuilds = res.response.map((build) => {
          build.size = humanSize(build.size);
          build.datetime = humanDate(build.datetime);
          build.changelog = ""
          build.downloads = 0
          return build
        }).reverse())

      this.deviceBuilds.map((build) => {
        request(changelogURL(build.filename, codename), false).then(
          (res) => build.changelog = res.includes("404") ? "Changelog data not found" : res
        )

        request(downloadsCountURL(build.filename, codename)).then(
          (d) => build.downloads = d.total
        )
      })

    },
    getIndex: function(filename) {
      return this.deviceBuilds.
      map((e,i) => e.filename == filename ? i : null
      ).filter((e) => e != null)
    }
  },
  updated() {
    if (this.codename) {
      let elems = document.querySelector('.collapsible-builds');
      let instances = M.Collapsible.init(elems);

      instances.options.onOpenEnd = () => {
        let build = document.querySelector('.collapsible-builds .active span').textContent
        history.pushState(null, '', `?device=${this.codename}&build=${build}`);
      }

      instances.options.onCloseEnd = () => {
        history.pushState(null, '', `?device=${this.codename}`);
      }

      if(this.showBuild){
        let indexToOpen = parseInt(this.getIndex(this.showBuild));

        if(!isNaN(indexToOpen)){
          instances.open(indexToOpen)
          document.querySelector(".collapsible-builds .active").scrollIntoView()
        }

      }
    }
  }
})
