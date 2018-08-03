from .report_item import ReportItem
import pandas


class ReportLineGraphItem(ReportItem):
    def __init__(self, data_frame, name, description, unique_key=None):
        super(ReportLineGraphItem, self).__init__(name, description, unique_key)
        self.data_frame = data_frame

    @classmethod
    def from_csv(cls, path, name, description, sep=',', unique_key=None):
        dataframe = pandas.read_csv(path, sep=sep, index_col=0)
        return cls(dataframe, name, description, unique_key=unique_key)

    def as_data_frame(self):
        return self.data_frame
