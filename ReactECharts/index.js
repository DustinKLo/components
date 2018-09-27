import React from 'react';
import PropTypes from 'prop-types';
import echarts from 'echarts';
import {APPCONFIG, THEMECONFIG} from 'constants/Config';

import elementResizeEvent from 'element-resize-event';

require('echarts/theme/' + APPCONFIG.charts.defaultTheme);

class ReactEcharts extends React.Component {
  componentDidMount() {
    const chart = this._renderChart();

    elementResizeEvent(this.refs.chart, () => {
      chart.resize();
    });

    const {onReady} = this.props;
    if (typeof onReady === 'function') onReady(chart);
  }

  componentDidUpdate() {
    this._renderChart()
  }

  componentWillUnmount() {
    echarts.dispose(this.refs.chart);
  }

  _renderChart() {
    const chartDom = this.refs.chart;
    const chart = echarts.getInstanceByDom(chartDom) || echarts.init(chartDom, APPCONFIG.charts.defaultTheme);

    const {option, showLoading, cursorPointer} = this.props;

    chart.setOption(option);

    if (showLoading) {
      chart.showLoading({color : THEMECONFIG.palette.primary1Color });
    } else {
      chart.hideLoading();
    }

    if (cursorPointer) {
      let canvasDom = chartDom.firstChild.firstChild;
      canvasDom.style.cursor = 'pointer';
    }

    return chart;
  }

  render() {
    const {height, width} = this.props;

    return (
      <div
        ref="chart"
        style={{height, width}}
      />
    )
  }
}

ReactEcharts.propTypes = {
  height: PropTypes.string.isRequired,
  option: PropTypes.object.isRequired,
  showLoading: PropTypes.bool,
  onReady: PropTypes.func
};

ReactEcharts.defaultProps = {
  width: 'inherit',
  height : 'inherit'
};

export default ReactEcharts;

