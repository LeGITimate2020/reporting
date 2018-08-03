from . import ReportTableItem


class ReportInteractivePlotItem(ReportTableItem):
    def item_as_traces(self):
        df = self.dataframe
        x = list(df.index.values)
        traces = []
        for column_name in df.columns:
            y = list(df[column_name])
            trace = {
                'name': column_name,
                'x': x,
                'y': y,
            }
            traces.append(trace)

        return traces
