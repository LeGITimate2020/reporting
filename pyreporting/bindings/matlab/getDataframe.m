function dataframe = getDataframe(time_series, time_series_names)
   % TODO: Doing this through a temp-file is janky and slow. Find a way to do this in-memory is possible.
   filepath = [tempname '.csv'];
   time_series_cell = timeseries2cell(time_series, time_series_names);
   cell2csv(filepath, time_series_cell);
   dataframe = py.pandas.read_csv(filepath, pyargs('index_col', py.int(0)));
end
