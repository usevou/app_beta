import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams, ModalController, LoadingController, Loading, AlertController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { AutocompletePage } from '../autocomplete/autocomplete';
import { InvitePage } from '../invite/invite';
import { EventoProvider } from '../../providers/evento/evento';
import { ErrorProvider } from '../../providers/error/error';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import firebase from 'firebase';

declare var google;

@Component({
  selector: 'page-set-location-event',
  templateUrl: 'set-location-event.html',
})
export class SetLocationEventPage {
  @ViewChild('map') mapElement: ElementRef;
  map: any;
  lat: any;
  lng: any;
  address;
  marker: any;

  param: any;
  public loading:Loading;

  constructor(public navCtrl: NavController, public navParams: NavParams, public geolocation: Geolocation, private modalCtrl: ModalController, public http: Http, public event: EventoProvider, public err: ErrorProvider, public alertCtrl: AlertController, public loadingCtrl: LoadingController) {
    this.address = {
      place: ''
    };
    this.param = navParams.data;
  }

  continuar(){
    var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + this.lat + "," + this.lng;
    this.http.get(url).map(res => res.json()).subscribe(data => {
      let cidade = data.results[0].address_components[3].short_name;
      this.param.push({lat: this.lat, lng: this.lng, cidade: cidade});
      if ( this.param[0].priv == "1" ){
        this.navCtrl.push(InvitePage, this.param);
      } else {
        this.event.getNomeCriador(firebase.auth().currentUser.uid).then(n => {
          this.param.push({nomeCriador: n[0].nome})
          this.event.cadEvento(this.param).then((e) => {
            if ( this.param[0].img != 'assets/event_default.png' ){
              this.event.saveImg(e.key,this.param[0].img);
            }
            this.navCtrl.pop();
            this.navCtrl.pop();
          }, (error) => {
            this.loading.dismiss().then( () => {
              let alert = this.alertCtrl.create({
                title: "Ocorreu um erro!",
                message: this.err.messageError(error["code"]),
                buttons: [{
                  text: "Ok",
                  role: 'cancel'
                }]
              });
              alert.present();
            });
          });
        });
      }
    });
  }

  showAddressModal () {
    let modal = this.modalCtrl.create(AutocompletePage);
    modal.onDidDismiss(data => {
      this.address.place = data.desc;
      var url = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyCDS1iQAUYcxOPKpEFEvQG3vb0L2IcnQSI&place_id=" + data.id;
      this.http.get(url).map(res => res.json()).subscribe(data => {
        this.lat = data.results[0].geometry.location.lat;
        this.lng = data.results[0].geometry.location.lng;
        this.marker.setPosition(new google.maps.LatLng(this.lat, this.lng))
        this.map.set('center',new google.maps.LatLng(this.lat, this.lng))
      });
    });
    modal.present();
  }

  ionViewDidLoad(){
    this.geolocation.getCurrentPosition().then((position) => {

      this.lat = position.coords.latitude;
      this.lng = position.coords.longitude;

      this.loadMap();

    }, (err) => {
      console.log(err);
    });
  }

  loadMap(){

    let latLng = new google.maps.LatLng(this.lat, this.lng);

    let mapOptions = {
      center: latLng,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

    this.marker = new google.maps.Marker({
      map: this.map,
      animation: google.maps.Animation.DROP,
      position: latLng
    });

    google.maps.event.addListener(this.map, 'click', (event) => {
      this.lat = event.latLng.lat();
      this.lng = event.latLng.lng();
      this.marker.setPosition(new google.maps.LatLng(this.lat, this.lng));
    });

  }

}
