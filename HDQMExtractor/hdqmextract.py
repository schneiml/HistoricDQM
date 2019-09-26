from __future__ import print_function

from sys import argv
from glob import glob
from configparser import ConfigParser
from multiprocessing import Pool

CFGFILES = "cfg/*.ini"
ROOTFILES = "/eos/cms/store/group/comm_dqm/DQMGUI_data/"
DQMGUI = "https://cmsweb.cern.ch/dqm/offline/"
DQMGUI_SAMPLES = DQMGUI + "data/json/samples"
DQMGUI_JSROOT = lambda run, dataset, me: DQMGUI + "jsonfairy/archive/%d%s/%s" % (run, dataset, me)

N_JOBS = 10

# select only by run number. We might update a bit too often (all PDs for each PD) but that is fine.
runs = argv[1:]

# first, we read all the plot definitions.

cfgfiles = glob(CFGFILES)
plotdesc = ConfigParser()

for f in cfgfiles:
  try: 
    plotdesc.read_file(f)
  except:
    print("Could not read %s, skipping..." % f)


# then, collect the data sources we have for each run

def find_run_eos(number):
  pass


allfiles = set()
for run in runs:
  files = find_run_eos(run)
  allfiles.update(files)


# finally, extract data.

# we always extract all runs in a file, so we can save the opening overhead in some cases
def process_file(f):
  def extract_mes(f, mes):
    # retrieve data from datastore and repack it into a format easily digested by ROOT
    # this requires looking for all runs/lumis in the file and reporting metadata about them
    pass

  def extract_metric(tdirectory, plot, metadata):
    # do the actual fitting work. This will need to load actual ROOT.
    import ROOT
    # extend object here
    data = dict(metadata)
    return data

  def write_to_database(data):
    # TODO: we probably want to keep a DB transaction open for each file.
    pass

  mespaths = [section['relativepath'] for section in plotdesc]
  tdirectories = extract_mes(f, mes)
  for metadata, tdirectory in tdirectories:
    for plot in plotdesc:
      data = extract_metric(tdirectory, plot, metadata)
      write_to_database(data)

pool = Pool(10)
for mes_to_store in pool.imap_unordered(process_file, allfiles):
  # nothing to do, just wait for all to finish
  pass


