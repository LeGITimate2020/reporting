# PyReporting
This is a Python reporting library 

## Getting Started

### Prerequisites

#### Environment
1) Python 3.6+ -- This project uses type hints 
1) Node.js version 8+ -- Needed to build the JS used for some of the interactive UI controls

#### Clone repo

    $ git clone <repo URI>


#### Libraries

    # Install all Python dependencies
    $ pip install -r requirements.txt
    
    $ cd pyreportingJs

    # Install and build JS packages (option 1)    
    $ yarn install
    $ yarn build
    
    # If you don't have yarn, use npm (option 2)
    $ npm install
    $ npm run build


### Running the samples
Before running samples for the first time, you should download bokeh's sample dataset.

    $ python
    >>> import bokeh
    >>> bokeh.sampledata.download()

### Run sample_report.py
`sample_report.py` contains one example of every type of report component.

    # NOTE: Make sure you're in the root of the pyreporting project (where requirements.txt lives) 

    # Launch with module command
    $ python -m examples.sample_report

    # Launch with file path command
    $ PYTHONPATH=. python ./examples/sample_report.py

After running this command, a directory should be created in `./examples/report/Sample Report/[timestamp]` and 
a browser should open with your report.
