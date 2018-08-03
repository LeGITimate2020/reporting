from .report_item import ReportItem


class ReportTextItem(ReportItem):

    def render_text_snippet(self):
        return self.get_description()
