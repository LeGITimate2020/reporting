from abc import ABC


class ReportItem(ABC):
    '''
    A ReportItem comprises a list of items. Each item says what it should be and the data that backs it.
    The various renderers take the Report (layout + data) and figure out how to render that in different formats.
    '''
    def __init__(self, name, description, unique_key=None):

        # Human readable name
        self.name = name
        self.description = description

        # labels (only used by the web renderer at this point)
        self.labels = []

        # Unique_key is used for versioning
        if unique_key is None:
            unique_key = name
        self.unique_key = unique_key

    def add_label(self, label):
        self.labels.append(label)

    def get_labels(self):
        return self.labels

    def get_name(self):
        return self.name

    def get_description(self):
        return self.description

    def get_unique_key(self):
        return self.unique_key
