classdef TableStudyItem < StudyItem
    % This class is responsible for storing and handling all the data and
    % metadata necessary to interface with the Python web endpoint for CSV
    % Tables uploaded to studies
    properties
        table;
        csv_path;
        formatting;
    end
    methods
        function obj = TableStudyItem(name, table, description)
            obj = obj@StudyItem();
            obj.name = name;
            obj.table = table;
            obj.csv_path = obj.createFilePath();
            obj.description = description;
            obj.formatting = py.dict();

            if isa(obj.table, 'cell')
                cell2csv(obj.csv_path, obj.table)
            elseif isa(obj.table, 'table')
                writetable(obj.table, obj.csv_path, 'WriteRowNames', true)
            end
        end

        function report_item = getReportItem(obj)
            dataframe = py.pandas.read_csv(obj.csv_path, pyargs('index_col', py.int(0)));
            report_item = py.pyreporting.reports.ReportTableItem(dataframe, obj.name, obj.description);
        end

        function path = createFilePath(obj)
            path = [tempname() '.csv'];
        end

        function name_value_pairs = getArgNameValuePairs(obj)
            name_value_pairs = {'csv_path', obj.csv_path, 'image_name', obj.name, ...
                                'csv_formatting', obj.getFormatting(), ...
                                'description', obj.description};
        end

        function delete(obj)
            delete(obj.csv_path);
        end

        % Sets the column formatting options for all columns not explicitly added with addFormatting
        function setDefaultFormatting(obj, formatting_entry)
            obj.formatting{'default'} = formatting_entry;
        end

        % Creates a formatting dictionary in python format to be sent to the python interface.
        function python_formatting = getFormatting(obj)
            python_formatting = obj.formatting;
        end

        % Add a column formatting Entry. Generate the argument entry either with
        % createFormattingEntry() or createDisabledFormattingEntry
        function addFormatting(obj, column_numbers, column_format)
            for i = 1:numel(column_numbers)
                obj.formatting{column_numbers(i)} = column_format;
            end
        end

        function addDisabledColumnFormatting(obj, column_numbers)
            obj.addFormatting(column_numbers, TableStudyItem.createDisabledFormattingEntry());
        end

        function clearFormatting(obj)
            obj.formatting = py.dict();
        end

        function show(obj)
            disp(obj.name);
            disp(obj.table);
        end
    end

    methods (Static)
        % colors is a cell array of valid html color strings
        % values is an array of numbers matching in length with colors.
        function column_entry = createFormattingEntry(values, colors)
            colors = py.list(colors);
            values = py.list(values);
            assert(length(values) == length(colors));
            column_entry = py.dict(pyargs('domain', values, 'range', colors));
        end

        % Returns a formatting entry specifying that a certain column is disabled.
        function column_entry = createDisabledFormattingEntry()
            column_entry = py.dict(pyargs('disabled', true));
        end
    end
end
