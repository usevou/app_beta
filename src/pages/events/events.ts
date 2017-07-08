import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, Platform, AlertController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { CriarEventoPage } from '../criar-evento/criar-evento';
import { EventDetailPage } from '../event-detail/event-detail';
import { AngularFireAuth } from 'angularfire2/auth';
import { EventoProvider } from '../../providers/evento/evento';
import { ErrorProvider } from '../../providers/error/error';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { Storage } from '@ionic/storage';

declare var google;

@Component({
  selector: 'page-events',
  templateUrl: 'events.html'
})
export class EventsPage {
  maps: string = "list";
  search: any = false;
  authentic: any = false;

  @ViewChild('map') mapElement: ElementRef;
  map: any;

  lat: any;
  lng: any;
  plat: any;
  events: FirebaseListObservable<any>;

  stDtini;
  stDtfim;
  stTag;

  constructor(platform: Platform, public db: AngularFireDatabase, private storage: Storage, public navCtrl: NavController, afAuth: AngularFireAuth, public geolocation: Geolocation, public evento: EventoProvider, public alertCtrl: AlertController, public err: ErrorProvider) {
    this.plat = platform;
    const authObserver = afAuth.authState.subscribe( user => {
      if (user) {
        if (!user.isAnonymous){
          this.authentic = true;
          authObserver.unsubscribe();
        }
      } else {
        this.authentic = false;
        authObserver.unsubscribe();
      }
    });
    storage.get('dt_filtro').then((val) => {
      this.stDtini = val;
      let date = new Date(val);
      date.setDate(date.getDate()+1);
      date.setHours(20);
      date.setMinutes(59);
      this.stDtfim = date.toISOString();
      storage.get('tag').then((val) => {
        this.stTag = val;
        this.events = db.list('/evento', {
          query: {
            orderByChild: 'dti',
            startAt: this.stDtini,
            endAt: this.stDtfim
          }
        });
      });
    });
  }

  changeTab(){
    this.storage.get('dt_filtro').then((val) => {
      this.stDtini = val;
      let date = new Date(val);
      date.setDate(date.getDate()+1);
      date.setHours(20);
      date.setMinutes(59);
      this.stDtfim = date.toISOString();
      this.storage.get('tag').then((val) => {
        this.stTag = val;
        this.events = this.db.list('/evento', {
          query: {
            orderByChild: 'dti',
            startAt: this.stDtini,
            endAt: this.stDtfim
          }
        });
      });
    });
  }

  loadMap(){

    this.geolocation.getCurrentPosition().then((position) => {

      this.lat = position.coords.latitude;
      this.lng = position.coords.longitude;

      let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

      let mapOptions = {
        center: latLng,
        zoom: 15,
        disableDefaultUI: true,
        mapTypeControl: false,
        scaleControl: false,
        zoomControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }

      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

      this.events.forEach(eve => {
        eve.forEach(e => {
          let iconS = {
            url: 'assets/ic_pin_n.png',
            size: new google.maps.Size(36, 36)
          };
          let iconL = {
            url: 'assets/ic_pin_g.png',
            size: new google.maps.Size(48, 48)
          };
          let marker = new google.maps.Marker({
            map: this.map,
            animation: google.maps.Animation.DROP,
            position: new google.maps.LatLng(e.lat, e.lng),
            icon: (e.coin?iconL:iconS)
          });

          let content = '<div class="card-background-page-map">'+
                          '<div style="background-image:url('+e.img+')" class="card">'+
                            '<div class="fundo_card">';
                  if ( e.coin ){
                    content += '<div class="amigos_list"><img src="assets/selo.png"></div>';
                  }
                    content += '<div class="info_list">'+
                                  '<div class="icon_list"><ion-icon class="icon-coin"></ion-icon><div>'+(e.faixa_ini==0?'Gratuito':'R$'+e.faixa_ini)+''+(e.faixa_fim==0?'':(e.faixa_fim!=e.faixa_ini?' - R$'+e.faixa_fim:''))+'</div></div>'+
                                  '<div class="icon_list">'+
                                    '<ion-icon class="icon-bar"></ion-icon>'+
                                    '<ion-icon class="icon-comida"></ion-icon>'+
                                    '<ion-icon class="icon-wifi"></ion-icon>'+
                                    '<ion-icon class="icon-fumante"></ion-icon>'+
                                  '</div>'+
                                  '<div class="icon_list">'+
                                    (e.coin?'<ion-icon class="icon-vous"></ion-icon>':'')+
                                    '<ion-icon class="icon-dinheiro"></ion-icon>'+
                                    '<ion-icon class="icon-cartao"></ion-icon>'+
                                  '</div>'+
                               '</div>'+
                               '<div class="bottom_list">'+
                                 '<div style="display:table-cell;vertical-align:bottom;width:50px;">'+
                                   '<div class="top"><div class="block"></div><div class="block"></div></div>'+
                                   '<div class="date_list">'+
                                     '<div class="mes_list">'+e.mes+'</div>'+
                                     '<div class="dia_list">'+('0'+e.dia).slice(-2)+'</div>'+
                                     '<div class="hr_list">'+e.hr_ini+'</div>'+
                                   '</div>'+
                                 '</div>'+
                                 '<div class="present_list">'+
                                   '<div class="name_event">'+e.nome+'</div>'+
                                   '<div class="name_create" id="c">'+e.nomeCriador+'</div>'+
                                   '<div class="name_locale" id="l">'+e.cidade+'</div>'+
                                 '</div>'+
                               '</div>'+
                            '</div>'+
                          '</div>'+
                        '</div>';

          let infoWindow = new google.maps.InfoWindow({
            content: content,

          });

          google.maps.event.addListener(marker, 'click', () => {
            infoWindow.open(this.map, marker);
          });

          google.maps.event.addListener(infoWindow, 'click', () => {
            console.log('teste')
            this.openEvent(e.$key);
          });
        });
      });

    }, (err) => {
      console.log(err);
    });

  }

  openEvent(id){
    if ( this.authentic ){
      this.navCtrl.push(EventDetailPage, {id: id});
    } else {
      let alert = this.alertCtrl.create({
        title: "Você precisa ser um usuário!",
        message: "Faça seu cadastro ou login para poder acessar mais informações dos eventos.",
        buttons: [{
          text: "Ok",
          role: 'cancel'
        }]
      });
      alert.present();
    }
  }

  openNewEvent(){
    if ( this.authentic ){
      this.navCtrl.push(CriarEventoPage, null);
    } else {
      let alert = this.alertCtrl.create({
        title: "Você precisa ser um usuário!",
        message: "Faça seu cadastro ou login para poder criar seus próprios eventos.",
        buttons: [{
          text: "Ok",
          role: 'cancel'
        }]
      });
      alert.present();
    }
  }

}
