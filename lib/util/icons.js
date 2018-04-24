var translation = {
	FontAwesome: {
		default: 'fa fa-circle-o',

		contact: {
			default: 'fa fa-user'
		},

		content: {
			default: 'fa fa-map-marker',

			achievement: 'fa fa-trophy',
			audio: 'fa fa-headphones',
			code: 'fa fa-code',
			file: 'fa fa-file-o',
			game: 'fa fa-gamepad',
			image: 'fa fa-picture-o',
			receipt: 'fa fa-dollar',
			software: 'fa fa-floppy-o',
			text: 'fa fa-file-text-o',
			video: 'fa fa-video-camera',
			'web-page': 'fa fa-desktop'
		},

		event: {
			default: 'fa fa-exclamation',

			called: 'fa fa-phone',
			commented: 'fa fa-comment',
			created: 'fa fa-pencil-square-o',
			ate: 'fa fa-cutlery',
			edited: 'fa fa-pencil-square-o',
			exercised: 'fa fa-heartbeat',
			messaged: 'fa fa-comment',
			played: 'fa fa-play',
			purchased: 'fa fa-credit-card',
			slept: 'fa fa-bed',
			traveled: 'fa fa-plane',
			viewed: 'fa fa-eye',
			visited: 'fa fa-crosshairs'
		},

		location: {
			default: 'fa fa-map-marker'
		},

		organization: {
			default: 'fa fa-building-o'
		},

		person: {
			default: 'fa fa-user'
		},

		place: {
			default: 'fa fa-map-pin'
		},

		thing: {
			default: 'fa fa-cube',

			'apparel_&_accessories': 'fa fa-cube',
			appliances: 'fa fa-cube',
			automotive: 'fa fa-car',
			baby: 'fa fa-cube',
			'books_&_magazines': 'fa fa-book',
			electronics: 'fa fa-bolt',
			food: 'fa fa-cutlery',
			gifts: 'fa fa-gift',
			'health_&_beauty': 'fa fa-plus-circle',
			'home_&_kitchen': 'fa fa-home',
			'movies_&_tv': 'fa fa-television',
			music: 'fa fa-music',
			office: 'fa fa-briefcase',
			pet: 'fa fa-paw',
			products: 'fa fa-shopping-bag',
			shoes: 'fa fa-cube',
			'sports_&_outdoors': 'fa fa-futbol-o',
			'tools_&_home_improvement': 'fa fa-gamepad',
			'toys_&_games': 'fa fa-gamepad',
			other: 'fa fa-pencil-square-o'
		},

		provider: {
			default: 'fa fa-plug',

			dropbox: 'fa fa-dropbox',
			fitbit: 'fa fa-fitbit',
			github: 'fa fa-github',
			google: 'fa fa-google',
			instagram: 'fa fa-instagram',
			reddit: 'fa fa-reddit-alien',
			slice: 'fa fa-slice',
			spotify: 'fa fa-spotify',
			steam: 'fa fa-steam',
			twitter: 'fa fa-twitter'
		}
	}
};


function getIcon(library, type, name) {
	if (arguments.length <= 2) {
		name = type;
		type = library;
		library = 'FontAwesome';

		if (arguments.length == 1) {
			return translation[library][type].default;
		}
	}

	type = type.toLowerCase();

	if (name) {
		name = name.toLowerCase();
	}

	if (!translation[library]) {
		throw new Error('Invalid font library.');
	}

	if (!translation[library][type]) {
		return translation[library].default;
	}

	if (!translation[library][type][name]) {
		return translation[library][type].default;
	}

	return translation[library][type][name];
}

export default getIcon;
