inlets=1;
outlets=1;
autowatch=1;

//Initialize global variable to check if this is the only master looper
l = new Global('looper');




function bang{
	//Bang from live.thisdevice initializes
	
	if (l.exists==undefined){
	l.exists=1;
	}
	else{
	//Logic here for deactivating device, i.e. move bpatcher to deactiveated device area
	}
	
	tracks_observer = new LiveAPI(tracks_observer_callback,'live_set tracks N');
	this_device_api = new LiveAPI(this_device_callback,'this_device');
	this_track_api = new LiveAPI(this_track_callback,this_device_api.get("canonical_parent"));
	rename_track('MASTER LOOPER');
	
}

function tracks_observer_callback{

	//Logic for 
function rename_track(name){
	//Rename track
	post('\n', 'rename_track() called with args', name)
	this_track_api.set('name',name)
}