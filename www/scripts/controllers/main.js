'use strict';

/**
 * @ngdoc function
 * @name APP.controller:MainController
 * @description
 * # MainController
 * Controller of the APP
 */
app.controller('MainController',  [
			'$rootScope', '$scope', 'store', '$http', '$uibModal', 'MarkersService', 'CarruselService', 'databaseFactory', 'mesasFactory', 'ngProgressFactory', '$location', 'CONFIG', 'toaster', 'usuariosFactory', 'UsuariosService', 'eventosFactory', 'EventosService', 'markersFactory', 'multimediasFactory', 'autenticacionFactory', 
	function($rootScope,  $scope, store, $http, $uibModal, MarkersService, CarruselService, databaseFactory, mesasFactory, ngProgressFactory,  $location,  CONFIG, toaster, usuariosFactory, UsuariosService, eventosFactory, EventosService, markersFactory, multimediasFactory, autenticacionFactory){		
		$rootScope.urlFile = CONFIG.URLFILE;
		parent.pageActual = 'main';		
		$scope.evento = EventosService.get();	

		if($rootScope.usuarioLogueado){
			$scope.usuario = UsuariosService.get();
		}		
				
		$scope.banCargando = false;
		
		$scope.banCarruselLoading = false;
		// obtiene las multimedias para el carrusell
		$scope.getMultimedias = function(){		
			$scope.banCarruselLoading = true;
			var param = {		
				filter: ["evento_id="+ $scope.evento.id+"##multimediascategoria_id=1"]
			};		
			multimediasFactory.listar(param).then(function(res){
				$scope.banCarruselLoading = false;
				$scope.multimedias = res;
				CarruselService.set($scope.multimedias);
			});
		};
		
		$scope.multimedias = CarruselService.get();		
		
		if (typeof $scope.multimedias != 'undefined' && $scope.multimedias.length > 0) {
			//$scope.getMultimedias();
		}else{
			$scope.getMultimedias();
		}		
			
		/* MARKERS */		
		$scope.banMarkesLoading = false;
		$scope.getPois = function(){
			$scope.banMarkesLoading = true;
			var param = {		
				filter: ["evento_id="+ $scope.evento.id]
			};		
			markersFactory.listar(param).then(function(res){		
				$scope.markers = res;
				MarkersService.set($scope.markers);
				$scope.banMarkesLoading = false;
			});
		};				
		
		$scope.markers = MarkersService.get();		
		
		if (typeof $scope.markers != 'undefined' && $scope.markers.length > 0) {
			//$scope.getPois();
		}else{
			$scope.getPois();
		}		
		
		function onConfirmDesloguear(button) {
			if(button==2){//If User selected No, then we just do nothing
				return;
			}else{
				$scope.logoutEvento();// Otherwise we quit the app.
			}
		}			
		$scope.loginFace = function(){
			if($rootScope.usuarioLogueado){
				navigator.notification.confirm("¿Estas seguro que deseas salir de Facebook?", onConfirmDesloguear, "Confirmación", "Si,No");				
			}else{
				var face_id = 0;
				var fbLoginSuccess = function (userData) {	
					//alert(JSON.stringify(userData));									
					$.each(userData.authResponse, function(key, val) {
						if(key == "userID"){
							facebookConnectPlugin.api(val+"/?fields=id,email,first_name,last_name", ["public_profile"],
							function (result) {
								//alert(JSON.stringify(result));		
								var face_id = result.id;	
								var nombre = result.first_name;
								var apellido = result.last_name;
								var email = result.email;
								var auxUser = {};
								auxUser.facebook_id = face_id;
								auxUser.nombres = nombre;
								auxUser.apellido = apellido;
								auxUser.email = email;
								auxUser.id = 0;
								usuariosFactory.guardar(auxUser).then(
									function(res){
										autenticacionFactory.login_usuario(face_id).then(
											function(res) {
												if (typeof res.data.token != 'undefined') {
													/* si existe error lo muestra */
													if (res.data.error != null){
														/* usuario/password incorrecto 
														toaster.pop({
															type: res.data.error.tipo,
															body: res.data.error.mensaje,
															showCloseButton: true
														});*/
														alert("Error!");
													} else{
														setTimeout(function (){
															location.reload(true);
														 }, 200);
													}
												} else{
													alert("Error!");
												}					
											}
										);
									}, function(res){
										alert("Problemas para conectar con el servidor: "+res);
									}
								);													
							},
							function (error) {
								alert("Failed: " + error);
							});								 
						}
					})
				};
			
				facebookConnectPlugin.login(["public_profile", "email"],
					fbLoginSuccess,
					function (error) { alert("" + error) }
				);	
			}				
		}
		
		$scope.abrirLoginUsuario = function(){
			var modalInstanceLoginUsuario = $uibModal.open({
				animation: $scope.animationsEnabled,
				templateUrl: './views/login_usuario.html',
				//controller: 'ModalContactoController',
				scope: $scope,
				size: 'large'
			});		
			/*var auxUser = {};
			auxUser.facebook_id = '10152513265123922';
			auxUser.id = 0;		
			usuariosFactory.guardar(auxUser).then(
				function(res){
					autenticacionFactory.login_usuario('10152513265123922').then(
						function(res) {
							if (typeof res.data.token != 'undefined') {
								/* si existe error lo muestra 
								if (res.data.error != null){
									/* usuario/password incorrecto 
									toaster.pop({
										type: res.data.error.tipo,
										body: res.data.error.mensaje,
										showCloseButton: true
									});
									alert("Error!");
								} else{
									window.location.reload();
								}
							} else{
								alert("Error!");
							}					
						}
					);
				}, function(){
					alert("Problemas para conectar con el servidor!");
				}
			);	*/	
		}
		
		$scope.loginGoogle = function() {
			callGoogle();
		}
			
		$scope.logoutEvento = function(){
			$rootScope.eventoLogueado = false;
			$rootScope.usuarioLogueado = false;			
			autenticacionFactory.logout();
			window.location.reload();
		};	
				
		$scope.punto = {};
		$scope.map = {};
		
		$scope.cerrarModal = function () {
			$scope.modalInstance.close();
		};	
		
		$scope.modalInstance = {};
		
		$scope.abrirMapa = function(pLatitude, pLongitude, pEtiqueta, pId, pFecha){
			parent.pagePadreModal = parent.pageActual;
			parent.pageActual = 'modal';							

			$scope.punto = {};
			$scope.map = {};
			
			$scope.mapa_etiqueta = pEtiqueta;
			$scope.mapa_tiempo = pFecha;
			$scope.addressLongLat = pLatitude+","+pLongitude;
		
			$scope.punto = {
				id: pId,
				coords: {
					latitude: pLatitude,
					longitude: pLongitude
				},
				options: { draggable: false, labelContent: pEtiqueta, labelClass:"markerlabel" }
			};
		
			$scope.map = {
				center: {
					latitude: pLatitude,
					longitude: pLongitude
				},
				zoom: 15,
				options: {
					scrollwheel: false,
					mapTypeControl: false,
					streetViewControl: false,
					zoomControl: false
				}
			};	
			
			$scope.render = true;	
			
		    $scope.modalInstance = $uibModal.open({
				animation: $scope.animationsEnabled,
				templateUrl: './views/mapa.html',
				scope: $scope,
				size: 'large'
			});	

		}				
		
		$scope.test = function () {
			var modalInstanceUpload = $uibModal.open({
				animation: $scope.animationsEnabled,
				templateUrl: './views/multimedias/upload.html',
				//controller: 'ModalContactoController',
				scope: $scope,
				size: 'large'
			});
		}
		
		/*$scope.openUpload = function (pMultimediaId) {
			parent.pagePadreModal = parent.pageActual;
			parent.pageActual = 'modal';
		    $scope.modalInstance = $uibModal.open({
				animation: $scope.animationsEnabled,
				templateUrl: './views/multimedias/upload.html',
				//controller: 'ModalContactoController',
				scope: $scope,
				size: 'large'
			});			
			
			$scope.ultimaFoto = {};
			
			$scope.enviarMultimedia = function (pComentario){
				$scope.banCargando = true;
				var options = new FileUploadOptions();
				options.fileKey="file";
				options.fileName=$scope.tempimagefilepath.substr($scope.tempimagefilepath.lastIndexOf('/')+1);
				options.mimeType="image/jpeg";
				options.chunkedMode = true;
				
				var params = {};
				params.token = autenticacionFactory.getToken();
				params.multimediascategoria_id = 2;
				params.multimediastipo_id = 1;
				params.comentario = pComentario;				
				params.evento_id = $scope.evento.id;
				options.params = params;
				
				// Genero el objeto foto para insertar en BD
				$scope.ultimaFoto.id = 0;
				$scope.ultimaFoto.comentario = pComentario;
				$scope.ultimaFoto.evento_id = $scope.evento.id;
				$scope.ultimaFoto.ruta = $scope.tempimagefilepath;
				$scope.ultimaFoto.rotacion = "0";
				$scope.ultimaFoto.estado = 0;
								
				var ft = new FileTransfer();
				ft.upload($scope.tempimagefilepath, encodeURI(CONFIG.APIURL + "/subirarchivo/upload_imagen"), uploadSuccess, uploadFail, options);						
			};	
			
			function uploadSuccess(r){
				//console.log("Response = " + r.response);
				alert("ok!");
				$scope.cerrarModal();				
				/*toaster.pop({
					type: r.response.mensaje.tipo,
					body: r.response.mensaje.texto,
					showCloseButton: true
				});			
				$scope.ultimaFoto.estado = 0;
				databaseFactory.guardarFoto($scope.ultimaFoto);
			}
			
			function uploadFail(){
				alert("false!");
				$scope.cerrarModal();
				$scope.ultimaFoto.estado = 1;
				databaseFactory.guardarFoto($scope.ultimaFoto);	
				console.log("Fallo el upload de foto");	
				toaster.pop({
					type: 'error',
					body: 'No pudo subirse la foto, la app intenará enviarla luego, para ver su estado ingresa a "Tus Fotos"',
					showCloseButton: true
				});					
			}

		};	*/
		
		$scope.openLoginFace = function (pMultimediaId) {
			parent.pagePadreModal = parent.pageActual;
			parent.pageActual = 'modal';
		    $scope.modalInstance = $uibModal.open({
				animation: $scope.animationsEnabled,
				templateUrl: './views/alertas/facebook.html',
				//controller: 'ModalContactoController',
				scope: $scope,
				size: 'large'
			});			
			
			$scope.ultimaFoto = {};
			
			$scope.ingresarFace = function (pComentario){
				$scope.loginFace();
				$scope.modalInstance.close();
			};	
			
		};
		
		$scope.navegar = function(addressLongLat){
			if(device.platform == 'iOS'){
				window.open("http://maps.apple.com/?q="+addressLongLat, '_system');
			}else{
				window.open("geo:0,0?q="+addressLongLat+"("+$scope.mapa_etiqueta+")", '_system');
			}
		}
		
	}
]);