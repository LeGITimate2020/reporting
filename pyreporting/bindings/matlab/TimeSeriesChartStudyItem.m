classdef TimeSeriesChartStudyItem < ImageStudyItem
% A study item that can upload both a static image as well as the
% underlying time series data

    properties (Access = private)
        time_series_data;
        time_series_names;
        data_file_path;
    end

    methods (Access = public)
        function obj = TimeSeriesChartStudyItem(name, image, description, time_series_data, time_series_names)
            % ImageStudyItem handles static image uploads
            obj = obj@ImageStudyItem(name, image, description);
            obj.time_series_data = time_series_data;
            obj.time_series_names = time_series_names;
            obj.data_file_path = obj.createDataFilePath();
        end

        function path = createDataFilePath(obj)
            path = [tempname() '.csv'];
        end

        % Write the time series data to a CSV file
        function writeDataToFile(obj)
            time_series_cell = timeseries2cell(obj.time_series_data, obj.time_series_names);
            cell2csv(obj.data_file_path, time_series_cell);
        end

        function report_item = getReportItem(obj)
            dataframe = getDataframe(obj.time_series_data, obj.time_series_names);
            report_item = py.pyreporting.reports.ReportLineGraphItem(dataframe, obj.name, obj.description);
        end
    end
end
