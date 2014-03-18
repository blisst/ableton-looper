inlets=1;
outlets=1;
autowatch=1;
/*

Gotta figure out how to manage the save state

*/


//Initialize global variable to check if this is the only master looper
l = new Global('looper');

//Initialize an array to hold track choices
var menu_choices=new Array();

//Initialize number of tracks
var num_tracks = 0;

//Initialize object to hold track names and ids
var tracks = new Object();

//Weird behavior
var first_call = 0;

//Initialize x, y, coords for menus (pat = patching, pre = presentation)
var menu_pat_x = 30;
var menu_pat_y = 91;
var menu_pre_x = 18;
var menu_pre_y = 41;
var y_pat_size = 22;
var y_pre_size = 22;

function gettracks(){
	post('\n','tracks ',set_api.get('tracks'))
	post('\n','tracks ',set_api.get('return_tracks'))
}

function track_name_observer(args){
	//Gets called when position changes or when name changes
	//Only does anything when name changes
	
	post('\n','track_name_observer called with args ',args)
	prop=args.shift();
	
	if (prop!='name'){return}
	
	if (prop=='name'){ 
		if (tracks.names.indexOf(String(args))==-1){
		//If name is new, send to populate_tracks to redo naming, then update menus
			populate_tracks(tracks.allids);
			populate_menus();
		}
		else{return} //Do nothing		
	}
}

function getval(wanted,given,val){
	
	if (wanted=='name'){
		if (given=='name'){return val}
		if (given=='id'){return tracks.names[tracks.ids.indexOf(val)]}
	}
	if (wanted=='id'){
		if (given=='id'){return val}
		if (given=='name'){return tracks.ids[tracks.names.indexOf(val)]}
	}
}

function tracks_observer(args){
	//This getting called means that the position of tracks or ids have changed.
	prop=args.shift();
	
	if (prop=='tracks'){
		//Remove 'id' from list
		a=[];
		
		for (i in args){
			if (args[i]!='id'){
				a.push(args[i])
			}
		}
		populate_tracks(a);
		populate_menus();
	}
}

function populate_tracks(args){
		//Populates a list of group tracks and their ids and APIs	
		//Args should always be all the track ids 
		post('\n','populate_tracks called with args ',args)
		tracks.ids=[];
		tracks.names=[];
		tracks.apis=[];
		tracks.allnames=[]; //Index of these is track index also
		tracks.allids=args; 
				
		for (i=0;i<args.length;i++){
			track_api = new LiveAPI(track_name_observer,String('id '+args[i]));
			
			name=String(track_api.get('name'));
			id = Number(track_api.id);
			
			tracks.allnames.push(name);
			tracks.allids.push(id);
			
			if (track_api.get('is_foldable')==1){
				//Must do the following in this order, since setting the name property will cause calling of tracks_name_observer, which will check tracks.names for the name and, if not there, re-call tracks_observer 
				tracks.names.push(name);
				tracks.ids.push(id)
				track_api.property='name';
				//
				tracks.apis[i]=track_api;
				
				
			}
		}
}

function populate_menus(){
	post('\n','populate_menus called')
	//Populates umenus with available tracks, resets ones which have been chosen
	for (i=0;i<num_tracks;i++){
		o = this.patcher.getnamed('menu'+i);
		o.message('clear');
		o.append('None');
		
		for (i2 in tracks.names){
			o.append(tracks.names[i2]);
		}
		
		if (menu_choices[i]==undefined || menu_choices[i]==0){
			menu_choices[i]=0; //If no menu choice, set it to 'None'
			o.setsymbol('None');
		}
		else{
			o.setsymbol(getval('name','id',menu_choices[i]));
		}	
	}
	post('\n','made it past setting symbol')
	post('\n','menu_choices is ',menu_choices)
}

function choice(obj,data){
	post('\n','choice called with args ',obj,data)
		
	if (obj.match('menu')=='menu'){
		ind=obj.charAt(4);
		if (data=='None'){menu_choices[ind]=0}
		else{
		id=getval('id','name',data);
		menu_choices[ind]=id;
		}
		post('\n','id ',menu_choices[ind],'placed at menu_choices index ',obj.charAt(4))
		
		/*
		//Check if group track contains a "1" track and a "ReSmpl" track
		for (i=tracks.allids.indexOf(id)+1;i<tracks.allids.length;i++){
			track_api = new LiveAPI('id '+tracks.allids[i]);
			name = String(track_api.get('name');
			if (isNumber(name)){
				tracks.overdubs[ind]
		*/	
	}
	
	post('\n','menu_choices after choice ',menu_choices)
}
/*
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
*/

function bang(){
	//Bang from live.thisdevice initializes
	if (l.exists==undefined){
		l.exists=1;
		set_api = new LiveAPI(tracks_observer,'live_set');
		set_api.property='tracks'; //Will populate tracks since tracks_observer callback does so
	
		//Initialize return track
		returns=set_api.get('return_tracks')
		e=0;	
		for (i in returns){
			if (returns[i]=='id'){continue}
			else{
				name = new LiveAPI('id '+String(returns[i]))
				if (name=='ToLpr'){
					e=1;
					break
				}
			}		
		}
		name=undefined;
		
		if (e==0){
			set_api.call('create_return_track')
			returns=set_api.get('return_tracks')
			return_api=new LiveAPI('id '+String(returns.pop()))
			return_api.set('name','ToLpr')
		}
		
		this_device_api = new LiveAPI('this_device');
		this_track_api = new LiveAPI(this_device_api.get("canonical_parent"));
				
		//These guys gotta be run after everything else is initialized.
		loopers(1);
		rename_track('MASTER LOOPER');
		this_track_api.set('color',16729302);
		post('\n','color changed')
		
		
	}
	else{
		deactivate()
	} 
}

function notifydeleted(){
	l.exists=undefined;
	tracks=undefined;
	
	for (i=0;i<num_tracks;i++){
		delete_menu(i)
	}
}

function deactivate(){
	if (!this.patcher.getnamed("deactivated[0]")){	
		this.patcher.newobject('comment',
			'@text','Device Deactivated',
			'@patching_rect',112,301,389,37,
			'@fontsize',26.5,
			'@fontname','Arial Bold',
			'@presentation_rect',7,34,161.333344,67,
			'@presentation',1,
			'@textjustification',1,
			'@varname','deactivated[0]')
			
		this.patcher.newobject('comment',
			'@text','More than one Looper',
			'@patching_rect',129,266,252,24,
			'@fontsize',15.5,
			'@fontname','Arial Bold',
			'@presentation_rect',37.166672,71,203,24,
			'@presentation',1,
			'@textjustification',1,
			'@varname','deactivated[1]')
	}
}	

function create_menu(ind){
	this.patcher.newdefault(100,18,'umenu',
		'@patching_rect',menu_pat_x,menu_pat_y,100,18,
		'@presentation',1,
		'@presentation_rect',menu_pre_x,menu_pre_y,100,18,
		'@pattrmode',1,
		'@parameter_enable',1,
		'@varname','menu'+ind)
	
	this.patcher.newobject('comment','@text',String(ind+1),
		'@patching_rect',menu_pat_x-18,menu_pat_y-4,23,27,
		'@presentation_rect',menu_pre_x-18,menu_pre_y-4,23,27,
		'@presentation',1,
		'@fontname','Arial Bold',
		'@fontsize',17.56525,
		'@varname','comment'+ind)
		
	
	menu_pat_y=menu_pat_y+y_pat_size;
	menu_pre_y=menu_pre_y+y_pre_size;
}

function delete_menu(ind){
	o = this.patcher.getnamed('menu'+ind);
	this.patcher.remove(o);
	o = this.patcher.getnamed('comment'+ind);
	this.patcher.remove(o);
		
	menu_pat_y=menu_pat_y-y_pat_size;
	menu_pre_y=menu_pre_y-y_pre_size;
}

function loopers(val){
	if (l.exists==undefined){
		return
	}
	
	post('\n','loopers called')
	if (val>num_tracks){
		for (i=num_tracks;i<val;i++){
			create_menu(i);
		}
	}
	if (val<num_tracks){		
		for (i=num_tracks-1;i>val-1;i--){
			post('\n','here num_tracks is ',num_tracks,' val is ',val)
			delete_menu(i);
			menu_choices.pop();
		}
	}
	
	num_tracks=val;
	populate_menus();
		
}

function rename_track(word){
	//Rename track
	post('\n', 'rename_track() called with args', word)
	this_track_api.set('name',word);
}
