from .report_item import ReportItem
from logging import getLogger

logger = getLogger(__name__)


class Report:
    def __init__(self, name, unique_key=None):
        self.items = []
        self.name = name
        if unique_key is None:
            unique_key = name
        self.unique_key = unique_key
        self.report_labels = []

    def add_item(self, item: ReportItem):
        ''' Add an item to the list of items '''
        self.items.append(item)

    def add_items(self, items):
        ''' Add items to the list of items '''
        self.items.extend(items)

    def get_items(self):
        ''' Get the list of items '''
        return self.items

    def get_report_labels(self):
        return self.report_labels

    def get_uniquely_keyed_items(self):
        ''' Get a list of (unique_key, item) for each report item '''
        results = []
        keys_seen = set()
        for item in self.get_items():
            i = 0
            while True:
                lookup_key = f'{self.get_unique_key()}_{item.get_unique_key()}_{i}'
                if lookup_key not in keys_seen:
                    keys_seen.add(lookup_key)
                    results.append((lookup_key, item))
                    break
                logger.warning(f'Duplicate lookup key found for item: {item.get_name()} key: {item.get_unique_key()}. '
                               'Explicitly include proper unique keys to avoid ordering fragility for chart versioning.')
                i += 1
        return results

    def add_label(self, label):
        self.report_labels.append(label)

    def get_name(self):
        return self.name

    def get_unique_key(self):
        return self.unique_key

    def render_to_html(self):
        '''
        Render each item to HTML, concatenate, and return

        :return: Tuple of html and list of assets referenced by the HTML.
        '''
        # TODO: Consider adding any headers here (& footer below) or if that would just be an item in the list
        concatenated_html = ''
        concatenated_assets = []
        for item in self.items:
            html, assets = item.render_html_snippet()
            concatenated_html += html
            concatenated_assets += assets

        return concatenated_html, concatenated_assets

    def render_to_text(self):
        ''' Render each item to TEXT, concatenate, and return '''
        text = ''
        for item in self.items:
            text += item.render_text_snippet()

        return text
