import React from 'react';
import { BootstrapTable, TableHeaderColumn, ExportCSVButton } from 'react-bootstrap-table';
import { Link } from 'react-router';
import v4 from 'uuid/v4';

import { ProgressBar, BoxTitle, NoContentWarning } from 'components/common/utils';
import { DisclaimerDialog } from 'components/common/modalDialogs';

import 'styles/custom/react-bootstrap-table-all.min.css';


class DataTable extends React.Component {

  constructor(props) {
    super();
    this.state = {
      dataList: props.dataList,
      showDialog: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.dataList !== nextProps.dataList) {
      this.setState({
        dataList: nextProps.dataList
      });
    }
  }

  handleExportCSVButtonClick() {
    this.setState({showDialog: true});
  }

  _handleClose() {
    this.setState({showDialog: false});
  }

  createCustomCSVExportButton(onClick) {
    return (
      <div>
        <ExportCSVButton onClick={this.handleExportCSVButtonClick.bind(this)}>
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

  linkFormatter(cell, row) {
    let link = this.props.childDataSource + '/' + cell;
    let cells = cell.toString().split('/');
    return <Link to={link}>{cells[cells.length - 1]}</Link>;
  }

  externalLinkFormatter(cell, row) {
    let link = this.props.externalLink + "?q=" + cell;
    return <a href={link}>{cell}</a>
  }

  _renderTableHeaderColumns(column) {
    let columnProps = {
      key: v4(),
      dataField: column.field,
      isKey: column.isKey ? column.isKey : false,
      hidden: column.hidden,
      dataSort: true,
      style: { fontWeight: 400 },
      tdStyle : {fontWeight : 'normal', color:'#636363', paddingTop: '1.2rem', paddingBottom : '1.2rem'},
      width: column.width + '',

      dataFormat: column.link ?
        (column.externalLink ? this.externalLinkFormatter.bind(this) : this.linkFormatter.bind(this)) :
        column.formatter,

      row: column.row ? column.row : '0',
      rowSpan: column.rowSpan ? column.rowSpan : '1',
      colSpan: column.colSpan ? column.colSpan : '1',

      headerAlign: column.row == '0' ? 'left' : null,

      thStyle: column.row == '0' ? {fontSize: '24px', color: 'grey'} : null
    };

    if (column.filter) {
      columnProps['filter'] = column.filter;
      columnProps['filterFormatted'] = true;
      columnProps['formatExtraData'] = column.formatExtraData;
    }

    if (column.sortFunc) {
      columnProps['sortFunc'] = column.sortFunc;
    }

    return <TableHeaderColumn {...columnProps}>{column.title}</TableHeaderColumn>;
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


  render() {
    let content = <ProgressBar title={this.props.title} /> ;
    let noContentMessage = this.props.noContentMessage
      ? this.props.noContentMessage
      : `No ${this.props.title}`;
    const options =  {
      exportCSVBtn: this.createCustomCSVExportButton.bind(this),
      sizePerPage: this.props.sizePerPage,
      sortIndicator : false,
      toolBar : this.createCustomToolbar.bind(this)
    };

    const boxTitle = this.props.title ? (
      <BoxTitle title={this.props.title} />
    ) : null;

    if (this.state.dataList && this.state.dataList.length > 0) {
      content = (
        <div style={dataTableStyle}>
          {boxTitle}
          <BootstrapTable
            bordered={false}
            options={options}
            remote={false}
            data={this.props.dataList}
            pagination={this.props.pagination}
            search={this.props.search}
            exportCSV={this.props.exportCSV && this.props.isDataOwner}
            csvFileName={this.props.csvFileName}
          >
            { this.props.columns.map(this._renderTableHeaderColumns.bind(this))  }
          </BootstrapTable>
        </div>
      );
    } else if (this.state.dataList && this.state.dataList.length == 0) {
      content = <NoContentWarning message={noContentMessage} />
    }

    return content
  }
}

const dataTableStyle = {
  fontSize: '13px'
};

DataTable.defaultProps = {
  pagination: true,
  search: true,
  exportCSV: true,
  isDataOwner: true,
  csvFileName: 'Spreadsheet.csv',
  sizePerPage: 10
};


export default DataTable;
