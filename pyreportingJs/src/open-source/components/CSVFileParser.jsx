import React from 'react';
import PropTypes from 'prop-types';
import { DropzoneComponent } from 'react-dropzone-component';
import Papa from 'papaparse';


/**
 * CSVFileParser allows a user to drag-and-drop and copy & paste a CSV file and then it parses it into an Object and
 * calls an event handler supplied by the parent component.
 * All processing is done in-browser and data is never uploaded or sent to a server.
 */
export default class CSVFileParser extends React.Component {
  static propTypes = {
    onLoad: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {};
    this.dropzone = null;
  }

  handleDropzoneInit = (dropzone) => {
    this.dropzone = dropzone;
  };

  handleParseCSV = fileName => (evt) => {
    const rawFile = evt.target.result;
    const csvResults = Papa.parse(rawFile);
    this.props.onLoad(csvResults, fileName);
  };

  handleAddedFile = (addedFile) => {
    if (addedFile) {
      const fileName = addedFile.upload.filename;
      const reader = new FileReader();
      reader.onload = this.handleParseCSV(fileName);
      reader.readAsText(addedFile, 'UTF-8');

      // Remove file from preview component
      this.dropzone.removeFile(addedFile);
    }
  };

  render() {
    const componentConfig = {
      iconFiletypes: ['.csv', '.tsv'],
      showFiletypeIcon: true,
      postUrl: '/',
    };

    // Full list of supported eventHandlers: https://github.com/felixrieseberg/React-Dropzone-Component
    const eventHandlers = {
      init: this.handleDropzoneInit,
      addedfile: this.handleAddedFile,
    };

    const djsConfig = {
      autoProcessQueue: false,
      dictDefaultMessage: 'Drag and drop a .CSV file here to use as your data source',
    };

    return (
      <div className="row">
        <div className="col-lg-12">
          <DropzoneComponent
            config={componentConfig}
            action="api/files/upload"
            eventHandlers={eventHandlers}
            djsConfig={djsConfig}
          />
        </div>
      </div>
    );
  }
}
