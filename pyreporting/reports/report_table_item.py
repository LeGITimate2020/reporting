from .report_item import ReportItem
import pandas as pd


class ReportTableItem(ReportItem):
    def __init__(self, dataframe: pd.DataFrame, name: str, description: str):
        super(ReportTableItem, self).__init__(name, description)
        self.dataframe = dataframe

    @classmethod
    def from_csv(cls, path, name, description, sep=','):
        # TODO: parse dates when formatting works.
        dataframe = pd.read_csv(path, sep=sep, parse_dates=False, index_col=0)
        return cls(dataframe, name, description)

    def as_data_frame(self) -> pd.DataFrame:
        return self.dataframe
