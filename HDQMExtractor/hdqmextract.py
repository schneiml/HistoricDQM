from __future__ import print_function

from sys import argv
from glob import glob
from tempfile import NamedTemporaryFile
from collections import defaultdict
from configparser import ConfigParser
from multiprocessing import Pool

import re
import uproot

CFGFILES = "cfg/*.ini"
ROOTFILES = "/eos/cms/store/group/comm_dqm/DQMGUI_data/*/*/*/DQM*.root"
RUNFOLDER = re.compile("Run (\d+)(;\d*)?") # pattern of the Run folder inside the TDirectory file
PDPATTERN = re.compile("DQM_V\d+_R\d+__(.+__.+__.+)[.]root") # PD inside the file name
DQMGUI = "https://cmsweb.cern.ch/dqm/offline/"
DQMGUI_SAMPLES = DQMGUI + "data/json/samples"
DQMGUI_JSROOT = lambda run, dataset, me: DQMGUI + "jsonfairy/archive/%d%s/%s" % (run, dataset, me)

N_JOBS = 10

# select only by run number. We might update a bit too often (all PDs for each PD) but that is fine.
runs = argv[1:]

# first, we read all the plot definitions.

cfgfiles = glob(CFGFILES)
plotdesc = ConfigParser()

goodfiles = 0
for f in cfgfiles:
  try: 
    plotdesc.read(unicode(f))
    goodfiles += 1
  except:
    print("Could not read %s, skipping..." % f)
print("Read %d configuration files." % goodfiles)

# then, collect the data sources we have for each run

print("Listing files on EOS, this can take a while...")
eosfiles = glob(ROOTFILES)
print("Done.")

def find_run_eos(run):
  rungroup = "_R%09d_" % int(run)
  return [f for f in eosfiles if rungroup in f]

allfiles = set()
for run in runs:
  files = find_run_eos(run)
  allfiles.update(files)

# finally, extract data.

# we always extract all runs in a file, so we can save the opening overhead in some cases
def process_file(f):
  def extract_mes(f, mepaths):
    # retrieve data from datastore and repack it into a format easily digested by ROOT
    # this requires looking for all runs/lumis in the file and reporting metadata about them
    pdmatch = PDPATTERN.findall(f)
    if len(pdmatch) == 0:
      pd = ""
    else:
      pd = "/" + pdmatch[0].replace("__", "/")

    f = uproot.open(f)
    items = defaultdict(lambda: []) # (run, lumi, pd) -> [(sectionname, object), ...]

    basedir = f['DQMData']
    for run in basedir.keys():
      rundir = basedir[run]
      m = RUNFOLDER.match(run)
      if not m: continue # skip folders that do not look like runs
      runnumber = int(m.group(1))

      for section, me in mepaths:
        try:
          subsys, path = me.split('/', 1)
          subsysdir = rundir[subsys]
          # typically this will only be "Run summary"
          for lumi in subsysdir.keys():
            lumidir = subsysdir[lumi]
            meobj = lumidir[path]
            items[(runnumber, 0, pd)].append((section, meobj))
        except KeyError as e:
          pass # we don't expect all MEs to be present in all files

    outdata = []
    for (run, lumi, pd), objects in items.items():  
      with NamedTemporaryFile(delete = False) as t:
        with uproot.recreate(t.name, compression=None) as f:
          for name, value in objects:
            try:
              f[name] = value
            except:
              print("Could not write object for %s using uproot." % name)
      outdata.append(({"run": run, "lumisection": lumi, "pd": pd}, t.name))
    return outdata


  def extract_metric(tdirectory, plot, metadata):
    # do the actual fitting work. This will need to load actual ROOT.
    import ROOT
    # extend object here
    data = dict(metadata)
    return data

  def write_to_database(data):
    # TODO: we probably want to keep a DB transaction open for each file.
    pass

  mepaths = [(section.split(':')[1], plotdesc[section]['relativepath']) for section in plotdesc if section.startswith("plot:")]
  tdirectories = extract_mes(f, mepaths)
  for metadata, tdirectory in tdirectories:
    print(tdirectory, metadata)
    for plot in plotdesc:
      data = extract_metric(tdirectory, plot, metadata)
      write_to_database(data)

#pool = Pool(10)
#for _ in pool.imap_unordered(process_file, allfiles):
for _ in map(process_file, allfiles):
  # nothing to do, just wait for all to finish
  pass


