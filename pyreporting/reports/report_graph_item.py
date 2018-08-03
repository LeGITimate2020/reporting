import pandas
from . import ReportItem


class ReportGraphItem(ReportItem):

    LINE = 'line'
    STACKED = 'stacked'

    def __init__(self, data_frame, name, description, unique_key=None, output_type=LINE):
        super(ReportGraphItem, self).__init__(name, description, unique_key)
        self.data_frame = data_frame
        self.output_type = output_type

    @classmethod
    def from_csv(cls, path, name, description, sep=','):
        data_frame = pandas.read_csv(path, sep=sep, index_col=0)
        return cls(data_frame, name, description)

    def get_output_type(self):
        return self.output_type

    def as_data_frame(self):
        return self.data_frame
