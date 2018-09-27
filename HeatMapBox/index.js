import React from 'react';
import ReactMapboxGl, { Popup, GeoJSONLayer, Source, Feature, ScaleControl, ZoomControl } from 'react-mapbox-gl';
import { MAPCONFIG } from 'constants/Config';
import Color from 'color';
import _ from 'lodash';
import util from 'util';
import MapOverlay from 'components/common/MapOverlay';
import MapLogoOverlay from 'components/common/MapLogoOverlay';
import FlatButton from 'material-ui/FlatButton';
import json2csv from 'json2csv';
import FileSaver from 'file-saver';
import TextField from 'material-ui/TextField';
import Axios from 'axios';

import 'styles/custom/mapbox-gl-custom.css';

const Map = ReactMapboxGl({
  accessToken: MAPCONFIG.token,
  doubleClickZoom: false,
  touchZoomRotate: false,
  trackResize: false,
  dragPan: true,
  dragRotate: false,
  boxZoom: false,
  scrollZoom: false,
  keyboard: false,
  interactive: true,
  trackResize: true,
  preserveDrawingBuffer: true
});

const styles = {
  popupBtnLayout : {
    marginTop: '6px',
    lineHeight: '12px',
    height: '24px',
    width: '100%',
    borderRadius: '4px',
    minWidth: '70px',
    boxShadow: 'none',
    border: 'solid 1px #7caec5'
  }
};

const fillLayerPaint = {
  'fill-color': {
    type: 'identity',
    property: 'fill'
  },
  'fill-opacity': {
    type: 'identity',
    property: 'fill-opacity'
  },
  'fill-outline-color': '#cacaca'
};

const flyToOptions = {
  speed: 0.8,
};

class HeatMapBox extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      center: props.center,
      popupCoordinates: [0, 0],
      popupContent: null,
      popupStyle: {},
      zoom: [4],
      errorText: '',
      zipValue: ''
    };
  }

  exportMembers(zipcode) {
    const options = {
      params: {
        zipCode: zipcode,
        accountIds: this.props.accountIds
      }
    }
    Axios.get('/geo', options)
      .then(res => {
        let csvObject = json2csv({
          data: res.data.members,
          fields: res.data.headers
        });
        csvObject = new Blob([csvObject], {type: "text/csv"});
        FileSaver.saveAs(csvObject, `members_zip_code_${zipcode}.csv`);
      });
  }

  renderPopupContent (coordinates, properties) {
    const lineColor = Color(properties.fill).darken(0.15).rgb().string();
    const hoverColor = Color(properties.fill).lighten(0.65).rgb().string();

    return (
      <Popup coordinates={coordinates}>
        <div>
          <span style={{fontSize: '16px'}}>{properties.city}, {properties.state}</span><br/>
          <span><strong>Zipcode:</strong> {properties.zipcode}</span><br/>
          <span><strong>Member Count:</strong> {properties.population}</span><br/>

          { this.props.isDataOwner &&
            <FlatButton
              label="Export"
              primary={true}
              backgroundColor="#FFF"
              hoverColor="#e4f1f7"
              rippleColor="#c6dce6"
              style={styles.popupBtnLayout}
              labelStyle={{color: '#7caec5', fontSize: '12px', textTransform: 'none', fontWeight: 600}}
              onClick={this.exportMembers.bind(this, properties.zipcode)}
            />
          }
        </div>
      </Popup>
    );
  }

  onClick (e) {
    // Reset cursor back to default
    e.target._canvas.style.cursor = '';

    if (e.features && e.features[0] && e.features[0].properties) {
      const properties = e.features[0].properties;
      const lngLat = e.lngLat;
      const coordinates = [ lngLat.lng, lngLat.lat ];
      const zoomLevel = this.state.zoom[0] <= 5
        ? [5]
        : this.state.zoom;

      const popupContent = this.renderPopupContent(coordinates, properties);

      this.setState({
        center: coordinates,
        popupCoordinates: coordinates,
        popupContent: popupContent,
        zoom: zoomLevel,
        errorText: ''
      });
    }
  }

  sanitizeZip (e, newValue) {
    var sanitizedValue = newValue.replace(/[^0-9]/g, '');
    this.setState({
      zipValue: sanitizedValue
    });
  }

  pressEnterLocateZip (e) {
    const geoJsonData = this.props.geoJsonData;
    if(e.keyCode == 13 && e.target.value.trim()) {
      const zipCode = e.target.value;
      const filteredValue = geoJsonData.data.features.find(function(row) {
        return row.properties.zipcode == zipCode
      });

      if(filteredValue) {
        const properties = filteredValue.properties;

        const lat = parseFloat(properties.lat);
        const lng = parseFloat(properties.lon);

        const coordinates = [ lng, lat ];
        const zoomLevel = this.state.zoom[0] <= 5
          ? [5]
          : this.state.zoom;

        const popupContent = this.renderPopupContent(coordinates, properties);

        this.setState({
          center: coordinates,
          popupCoordinates: coordinates,
          popupContent: popupContent,
          zoom: zoomLevel,
          errorText: ''
        });
      } else {
        this.setState({
          errorText: 'Zip code not found'
        });
      }
    }
  }

  onZoom (e) {
    const zoomLevel = e.getZoom();
    this.setState({
      zoom: [zoomLevel]
    });
  }

  onDrag (e) {
    if(this.state.popupContent) {
      this.setState({
        popupContent: null
      });
    }
  }

  onToggleHover(cursor, e) {
    e.target._canvas.style.cursor = cursor;
  }

  handleMapSave (e) {
    const canvas = this.refs.map.container.querySelector('canvas');

    let logo = new Image();
    logo.src = '/static/images/mpulse-logo.png';

    logo.onload = function() {
      const logoHeight = 40;
      const logoWidth = 148;

      let tempCanvas = document.createElement('canvas');
      let tempCtx = tempCanvas.getContext('2d');
      let cw = tempCanvas.width=canvas.width;
      let ch = tempCanvas.height=canvas.height;

      let text = "mPulse Mobile";

      const logoPadding = 10;
      tempCtx.drawImage(canvas, 0, 0);
      tempCtx.globalAlpha = 0.85;
      tempCtx.drawImage(logo, cw - (logoWidth + logoPadding), ch - (logoHeight + logoPadding), logoWidth, logoHeight);

      tempCanvas.toBlob(function(blob) {
        FileSaver.saveAs(blob, "Population Map.png");
      });
    }
  }

  render() {
    const { height, geoJsonData } = this.props;
    const { center, popupCoordinates, popupContent, popupStyle, zoom } = this.state;

    if (_.isEmpty(geoJsonData.data.features)) {
      return <div></div>;
    }

    return (
      <div>
        <div style={{marginLeft: 'auto', marginRight: 0}}>
          <TextField
            hintText="Enter Zip Code"
            onKeyDown={this.pressEnterLocateZip.bind(this)}
            maxLength="5"
            errorText= {this.state.errorText}
            onChange={this.sanitizeZip.bind(this)}
            value={this.state.zipValue}
            style={{width: '120px'}}
          />
          <FlatButton
            label="Export Map"
            primary={true}
            backgroundColor="#FFF"
            hoverColor="#e4f1f7"
            rippleColor="#c6dce6"
            style={{position: 'absolute', right: '25px', lineHeight: '12px', height: '30px', width: '150px', borderRadius: '4px', minWidth: '70px', boxShadow: 'none'}}
            labelStyle={{fontSize: '16px', textTransform: 'none', fontWeight: 600}}
            onClick={this.handleMapSave.bind(this)}
          />
        </div>
        <div style={{position: 'relative'}}>
          <Map
             style={MAPCONFIG.style}
             zoom={zoom}
             containerStyle={{height: height, width: 'inherit'}}
             center={center}
             flyToOptions={flyToOptions}
             onZoom={this.onZoom.bind(this)}
             onClick={this.onDrag.bind(this)}
             onDrag={this.onDrag.bind(this)}
             ref="map"
           >

            <GeoJSONLayer
              id="layer"
              data={geoJsonData.data}
              fillPaint={fillLayerPaint}
              fillOnClick={this.onClick.bind(this)}
              fillOnMouseEnter={this.onToggleHover.bind(this, 'pointer')}
              fillOnMouseLeave={this.onToggleHover.bind(this, '')}
            />

            {popupContent}

            <ZoomControl
              position="bottom-right"
            />
            <ScaleControl
              position="bottom-left"
              measurement="mi"
            />
          </Map>
          <MapOverlay
            title="Member Count"
            barColors="#727374, #01a0e4"
          />
          <MapLogoOverlay
            title="stuff"
          />
        </div>
      </div>
    );
  }

}

export default HeatMapBox;
