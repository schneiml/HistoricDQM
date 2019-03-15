#!/bin/bash


LOGDIR="/data/users/HDQM/CMSSW_10_1_0_pre3/HistoricDQM/Logs"

#DCS JSON file production for collisions and cosmics
#python dcsonlyjson_all.py --min 294600 --cosmics -o .
#python Get_Run_RunDuration_LHCFill_info.py --cosmics
#cp Run_LHCFill_RunDuration_Cosmics.json /data/users/event_display/HDQM/v4/alljsons/2018/
python dcsonlyjson_all.py --min 314400 -o .
python Get_Run_RunDuration_LHCFill_info.py
cp Run_LHCFill_RunDuration.json /data/users/event_display/HDQM/v4/alljsons/2018/


echo "Starting muon plots"

export BASEV4=/data/users/event_display/HDQM/v4/alljsons/2018/Prompt/SingleMuon

#DoubleMuon

echo "Starting MuonPOG Double"
rm -rf ./JSON/*
python ./trendPlots_2018.py -C cfg/trendPlotsDQM_MuonPOG.ini -C cfg/trendPlotsMuonPOG.ini --dataset DoubleMuon --epoch Run2018 --epoch Commissioning2018 -r "run >= 314400" --reco Prompt -J json_DCSONLY.txt &> "${LOGDIR}/PromptDoubleMuonMuonPOG.log"
cp ./JSON/* $BASEV4/../DoubleMuon/MuonPOG
touch .doneDoubleMuonMuonPOG
echo "Finished MuonPOG Double"

#SingleMuon

echo "Starting MuonPOG Single"
rm -rf ./JSON/*
python ./trendPlots_2018.py -C cfg/trendPlotsDQM_MuonPOG.ini -C cfg/trendPlotsMuonPOG.ini --dataset SingleMuon --epoch Run2018 --epoch Commissioning2018 -r "run >= 314400" --reco Prompt -J json_DCSONLY.txt &> "${LOGDIR}/PromptSingleMuonMuonPOG.log"
cp ./JSON/* $BASEV4/MuonPOG/
touch .doneSingleMuonMuonPOG
echo "Finished MuonPOG Single"

echo "Starting CSC"
python dcsonlyjson_all.py --min 314400 -d csc -o .
rm -rf ./JSON/*
python ./trendPlots_2018.py -C cfg/trendPlotsDQM_CSC.ini -C cfg/trendPlotsCSC_all.ini --dataset SingleMuon --epoch Run2018 --epoch Commissioning2018 -r "run >= 314400" --reco Prompt -J json_DCSONLY_CSC.txt  &> "${LOGDIR}/PromptSingleMuonCSC.log"
cp ./JSON/* $BASEV4/CSC/
touch .doneSingleMuonCSC
echo "Finished CSC"

echo "Starting DT"
python dcsonlyjson_all.py --min 314400 -d dt -o .
rm -rf ./JSON/*
python ./trendPlots_2018.py -C cfg/trendPlotsDQM_DT.ini -C cfg/trendPlotsDT_all.ini --dataset SingleMuon --epoch Run2018 --epoch Commissioning2018 -r "run >= 314400" --reco Prompt -J json_DCSONLY_DT.txt  &> "${LOGDIR}/PromptSingleMuonDT.log"
cp ./JSON/* $BASEV4/DT/
touch .doneSingleMuonDT
echo "Finished DT"

echo "Starting RPC"
rm -rf JSON
python dcsonlyjson_all.py --min 314400 -d rpc -o .
python ./trendPlots_2018.py -C cfg/trendPlotsDQM_RPC.ini -C cfg/trendPlotsRPC_all.ini --dataset SingleMuon --epoch Run2018 --epoch Commissioning2018 -r "run >= 314400" --reco Prompt -J json_DCSONLY.txt &> "${LOGDIR}/PromptSingleMuonRPC.log"
cp ./JSON/* $BASEV4/RPC/
touch .doneSingleMuonRPC
echo "Finished RPC"
