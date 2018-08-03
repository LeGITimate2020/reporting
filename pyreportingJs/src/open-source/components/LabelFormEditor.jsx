import { WithContext as ReactTags } from 'react-tag-input';
import React from 'react';
import PropTypes from 'prop-types';

/**
 * LabelFormEditor shows labels and provides an input with auto-completion for labels to be added
 */
class LabelFormEditor extends React.Component {
  constructor(props) {
    super(props);
    const { labels } = this.props;

    const tags = this.translateLabelsArrayToTagArray(labels);

    this.state = {
      tags,
    };
  }

  componentWillReceiveProps(nextProps) {
    const tags = this.translateLabelsArrayToTagArray(nextProps.labels);
    this.setState({
      tags,
    });
  }

  /**
   * @returns Array
   * Example: ['label1', 'label2']
   */
  getLabels() {
    const { tags } = this.state;
    return tags.map(tag => tag.text);
  }

  handleDelete = (i) => {
    const { tags } = this.state;
    tags.splice(i, 1);
    this.setState({ tags });
    this.emitChange();
  };

  handleAddition = (tag) => {
    const { tags } = this.state;
    tags.push({
      id: tags.length + 1,
      text: tag,
    });
    this.setState({ tags });
    this.emitChange();
  };

  emitChange = () => {
    if (this.props.onChange) {
      this.props.onChange(this.getLabels());
    }
  };

  /**
   * Converts simple array of strings into an array of tag objects
   * @param labels e.g. ['label1', 'label 2']
   * @returns {Array} [{id: 1, text: 'label1', id: 2, text: 'label2'}]
   */
  translateLabelsArrayToTagArray = (labels) => {
    if (!Array.isArray(labels)) {
      return [];
    }
    return labels.map((label, index) => ({
      id: index,
      text: label,
    }));
  };

  render() {
    const { tags } = this.state;
    const { suggestions } = this.props;

    return (
      <ReactTags
        tags={tags}
        minQueryLength={1}
        suggestions={suggestions}
        autofocus={false}
        allowDeleteFromEmptyInput={false}
        handleDelete={this.handleDelete}
        handleAddition={this.handleAddition}
        placeholder="Add new label"
        classNames={{ tagInputField: 'form-control' }}
      />
    );
  }
}

LabelFormEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  suggestions: PropTypes.arrayOf(PropTypes.string).isRequired,
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default LabelFormEditor;
