import React from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { ProgressBar, BoxTitle } from 'components/common/utils';
import { DisclaimerDialog } from 'components/common/modalDialogs';
import Moment from 'moment';
import json2csv from 'json2csv';
import FileSaver from 'file-saver';
import Axios from 'axios';
import PropTypes from 'prop-types';
import v4 from 'uuid/v4';
import { THEMECONFIG } from 'constants/Config';

import 'styles/custom/react-bootstrap-table-all.min.css';


class RemoteDataTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataList: [],
      columnList: [],
      totalDataSize: 0,
      page: 1,
      pageSize: 15,
      filters: {},
      sortColumn: null,
      sortDirection: null,
      showDialog: false
    };
  }

  handlePageChange(page, sizePerPage) {
    this.setState({
      page: page
    }, this.fetchData(this.props.startDate, this.props.endDate, page, this.state.filters, this.state.sortColumn, this.state.sortDirection));
  }

  handleFilters(filterObj) {
    let serverFilter = {};
    for(var key in filterObj) {
      serverFilter[key] = filterObj[key].value;
    }

    this.setState({
      filters: serverFilter
    }, this.fetchData(this.props.startDate, this.props.endDate, this.state.page, serverFilter, this.state.sortColumn, this.state.sortDirection));
  }

  handleSorting(sortName, sortOrder) {
    this.setState({
      sortColumn: sortName,
      sortDirection: sortOrder
    }, this.fetchData(this.props.startDate, this.props.endDate, this.state.page, this.state.filters, sortName, sortOrder));
  }

  handleExportCSVButtonClick() {
    this.setState({showDialog: true});
  }

  _handleClose() {
    this.setState({showDialog: false});
  }

  fetchExportData() {
    let params_id = this.props.paramsId;
    let source_system = this.props.sourceSystem;

    let axiosOptions = {
      params: {
        source_system: source_system,
        id: params_id,
        filters: this.state.filters,
        sort_column: this.state.sortColumn,
        sort_direction: this.state.sortDirection,
        start_date: this.props.startDate,
        end_date: this.props.endDate
      }
    };

    Axios.get(this.props.exportDataSource, axiosOptions)
      .then(results => {
        let csvObject = json2csv({
          data: results.data.members,
          fields: results.data.headers
        });
        csvObject = new Blob([csvObject], {type: "text/csv"});
        FileSaver.saveAs(csvObject, this.props.csvFileName);
      });
  }

  fetchData(startDate, endDate, page, filters, sortColumn, sortDirection) {
    let params_id = this.props.paramsId;
    let source_system = this.props.sourceSystem;

    startDate = Moment(startDate).format('MM/DD/YYYY');
    endDate = Moment(endDate).format('MM/DD/YYYY');

    let axiosOptions = {
      params: {
        source_system: source_system,
        id: params_id,
        page: page,
        page_size: this.state.pageSize,
        filters: filters,
        sort_column: sortColumn,
        sort_direction: sortDirection,
        start_date: startDate,
        end_date: endDate
      }
    };

    Axios.get(this.props.dataSource, axiosOptions)
      .then(results => {
        this.setState({
          columnList: results.data.headers,
          dataList: results.data.members,
          totalDataSize: results.data.dataSize
        });
      });
  }

  createCustomToolbar(props) {

    return  (
      <div className='table-tool-bar'>
        <div className='col-xs-12 col-sm-12 col-md-12 col-lg-12 pull-right'>
          { props.components.btnGroup }
          { props.components.searchPanel }
        </div>
      </div>
    )
  }

  createCustomCSVExportButton(onClick) {
    return (
      <div>
        <ExportCSVButton
          onClick={this.handleExportCSVButtonClick.bind(this)}
        >
          <a href="#" onClick={(e) => e.preventDefault()}><i className="material-icons">system_update_alt</i></a>
        </ExportCSVButton>
        <DisclaimerDialog
          open={this.state.showDialog}
          clickHandler={() => onClick()}
          closeHandler={this._handleClose.bind(this)}
        />
      </div>
    );
  }

  componentDidUpdate() {
    $('.react-bs-table-pagination > div.row > div > div').unwrap();
  }

  componentWillMount() {
    this.fetchData(this.props.startDate, this.props.endDate, this.state.page, this.state.filters, this.state.sortColumn, this.state.sortDirection);
  }

  componentWillReceiveProps(nextProps) {
    if(this.props.startDate != nextProps.startDate || this.props.endDate != nextProps.endDate) {
      this.fetchData(nextProps.startDate, nextProps.endDate, this.state.page, this.state.filters, this.state.sortColumn, this.state.sortDirection);
    }
  }

  externalLinkFormatter(cell, row) {
    let link = this.props.externalLink + "?q=" + cell;
    return <a href={link}>{cell}</a>
  }

  render() {
    if(this.state.columnList.length === 0 && this.state.dataList.length === 0) {
      return (
        <div>
          <BoxTitle title={this.props.title} />
          <ProgressBar/>
        </div>
      );
    }
    const options = {
      onPageChange: this.handlePageChange.bind(this),
      page: this.state.page,
      sizePerPageList: [this.state.pageSize],
      onFilterChange: this.handleFilters.bind(this),
      onSortChange: this.handleSorting.bind(this),
      toolBar : this.createCustomToolbar.bind(this),
      exportCSVBtn: this.createCustomCSVExportButton.bind(this, this.fetchExportData.bind(this))
    };

    return (
      <div style={dataTableStyle}>
        <BoxTitle title={this.props.title} />
        <BootstrapTable
          headerStyle={headerStyle}
          remote={true}
          pagination={true}
          data={this.state.dataList}
          fetchInfo={{ dataTotalSize: this.state.totalDataSize }}
          options={options}
          exportCSV={this.props.exportCSV && this.props.isDataOwner}
        >
          {
            this.state.columnList.map(column => {
              let dataFormat = column.externalLink
                ? this.externalLinkFormatter.bind(this)
                : column.formatter;

              let filter = column.filter || { type: 'TextFilter' };

              return (
                <TableHeaderColumn
                  key={v4()}
                  dataField={column.field}
                  isKey={column.isKey}
                  style={{fontWeight: 400}}
                  filter={filter}
                  hidden={column.hidden}
                  dataFormat={dataFormat}
                  dataSort={true}>
                  {column.title}
                </TableHeaderColumn>
              );
            })
          }
        </BootstrapTable>
      </div>
    );
  }
}


RemoteDataTable.propTypes = {
  dataSource: PropTypes.string.isRequired,
  paramsId: PropTypes.string.isRequired
};

RemoteDataTable.defaultProps = {
  csvFileName: 'SpreadSheet.csv',
  isDataOwner : true,
  exportCSV : true
};

const headerStyle = {
  backgroundColor: THEMECONFIG.palette.primary1Color,
  color: '#FFF',
  fontWeight: '400 !important'
};

const dataTableStyle = {
  fontSize : '13px'
};

export default RemoteDataTable;
