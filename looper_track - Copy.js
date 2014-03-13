inlets=1;
outlets=1;
autowatch=1;

//Initialize the Global that is shared among looper tracks
l=new Global('looper');

/*Everything else initialized by an 'init' message which
should be banged from a live.thisdevice
*/
/* Live crashing on adding two devices to the same track
*/

function init(args){
	this_device_api = new LiveAPI(update_instance,'this_device');
	api_var_init();
	js_instance_init(args);
	
}

function api_var_init(){
	//Variables for the LiveApi of this device
	this_device_name=this_device_api.get('name');
	this_device_id=Number(this_device_api.id);
	
	//Initialize LiveApi for this track
	this_track_api = new LiveAPI(update_track_id,this_device_api.get("canonical_parent"));
	this_track_name=this_track_api.get('name');
	this_track_id=Number(this_track_api.id);
}

function js_instance_init(args){	
	//If it is first looper track on the scene, initialize the array
	if (typeof l.instances == 'undefined'){
		l.instances=new Array();
		l.tracks=new Array();
		/*instances property gives the device ids in an array where the 
		elements correspond to track numbers.  
		I.e. 0th index = first looper track
		*/
		l.onDelete='notifyloops';
	}
	
	//If not called with arguments, add a new instance
	if (args==undefined){
		//Add it to the JS array of instances at the end 
		l.instances.push(this_device_id);
		l.tracks.push(this_track_id);
		this_instance=Number(l.instances.length);  
		//this_instance goes from 1 not 0
	}
	//If called with arguments, update l.instances with saved instance
	//number (which goes from 1 to whatever)
	else {
		post('init called with args')
		this_instance=args[0];
		l.instances[(this_instance-1)]=this_device_id;
		l.tracks[(this_instance-1)]=this_track_id;
	}
	
	//Check if it's alone in the track, and either delete or rename
	alone=check_alone_in_track();
	
	if (alone!=1){
		post("Can't have two loopers in one track")
		delete_device(alone[0],alone[1]);
	}
	else {
		//Rename the track (if it's a group track)
		rename_track('LpkTrk'+this_instance);
	}
	
}	

function notifydeleted(){
	post('notifydelete called')
	l.instances.splice((this_instance-1),1);
	l.tracks.splice((this_instance-1),1);
	post('\n','l.tracks after deletion ',l.tracks)
	post('l.instances after deletion ',l.instances)
	
	if (alone==1){
		rename_track('WasLpr')
	}
	
	l.sendnamed('loopers','onDelete')
	
}

function notifyloops(){
	post('notifyloops called')
	update_instance(['id',this_device_id])
	update_track_id(['id',this_track_id])
}

function update_track_id(args){
	post('update_track_id called with args ',args)
	var old = this_track_id;
	var nu = args[1];
	post('\n','old id is ',old,'new is ',nu)
	
	//Changes ID if changed by something other than its own deletion
	if (l.tracks.indexOf(old)!=-1){ 
		post('old equal nu?')
		l.tracks[l.tracks.indexOf(old)]=nu;
		this_instance=l.tracks.indexOf(old)+1;
		api_var_init();	
	}
}

function update_instance(args){
	//Updates l.instances with current LiveAPI stuff
	//args is the device id as the LiveAPI currently sees it ['id',#]
	post('update_instance called with args ',args)
	var old = this_device_id;
	var nu = args[1];
	post('\n','old id is ',old,'new is ',nu)
	
	//Changes ID if changed by something other than its own deletion
	if (l.instances.indexOf(old)!=-1){ 
		post('old equal nu?')
		l.instances[l.instances.indexOf(old)]=nu;
		this_instance=l.instances.indexOf(old)+1;
		api_var_init();	
	}
}

function save(){
	//Saves which instance this device is of the looper tracks.
	embedmessage("init",this_instance);
}
	

function check_alone_in_track(){
/*	//If there is another Looper JS in the track, delete it
	track_ids=[];  //make an array of track_ids for each device
	
	for (i in l.instances){
		id=l.instances[i];
		a=new LiveAPI('id '+id); //Device
		b=new LiveAPI(a.get("canonical_parent"))//Track
		track_ids.push(b.id); 
	}
	a=undefined;
	b=undefined;
	post('\n')
	post('track ids are ',track_ids)
	
	//Now see if any of the track_ids are duplicates
	
	for (i in track_ids){
		id=track_ids[i];
		
		dup=track_ids.indexOf(id,(i+1));//Each id is track_id, i is position
		//in array, dup is duplicate track index in array

		if (dup!=-1){  //If there is a duplicate track_id, break and delete
			post('\n','here')
			t=new LiveAPI('id '+id);
			d_inds=t.get('devices'); //Gets an array [id,1,id,2...]

			for (i2=0;i2<d_inds.length;i2=i2+2){
				d=new LiveAPI('id '+d_inds[i2+1]);
				if (d.id==l.instances[dup]){
					t.call('delete_device',i2/2)
					post("Can't have two in one track")
					return 0;
				}
			}
		}
		
	}
	return 1;
	*/
	a=l.tracks.slice(0); //Clone l.tracks
	a.splice(this_instance-1,1);
	post('clone l.tracks ',a)
	post('this track id ',this_track_id)
	post('l.tracks ',l.tracks)
	if (a.indexOf(this_track_id)!=-1){
		d_inds=this_track_api.get('devices');
		for (i2=0;i2<d_inds.length;i2=i2+2){
				d=new LiveAPI('id '+d_inds[i2+1]);
				if (d.id==this_device_id){
					//this_track_api.call('delete_device',i2/2)
					//post("Can't have two in one track")
					return [this_track_id, i2/2];
				}
		}
	}
	return 1;
}

function delete_device(track_id, device_ind){
	track=new LiveAPI('id '+track_id);
	track.call('delete_device',device_ind);
	track=undefined;
}

function rename_track(args){
	//Rename track if it is a group track
	post('\n', 'rename_track() called with args', args)
	if (this_track_api.get('is_foldable')==1){
		this_track_api.set('name',args)
	}
			
}		



function bang(){
	post("this instance is ",this_instance)
	post('\n')
	post('l.instances is ', l.instances)
	//outlet(0,'notifyloops')
	}
	

function loadbang(){
	}


	

	
function init_js(){
	l.instances=undefined;
	l.tracks=undefined;
	init();
	}
	
function record(){
	/*To record both clips already playing and the looper,
	we want to get the current scene in which the looper is playing
	then 
	1. Create a scene (create_scene(index)  (-1 adds to end of list)
	2. trigger_session_record (optional: record_length)
	3. Capture and insert scene: capture_and_insert_scene()
	4. Delete the scene at the previous index. 
		*/
	}
	
	
	