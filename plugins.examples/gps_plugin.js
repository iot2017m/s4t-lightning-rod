//JSON to send 
// {
//     'm_authid': '22c5cfa7-9dea-4dd9-9f9d-eedf296852ae',
//     'm_resourceid': 'c1c06bee-00d3-4cb6-8b2c-4e029211bf06',
//     'gps_device': '/dev/ttyUSB1',
//     'ckan_host': 'smartme-data.unime.it',
//     'ckan_port': '80',
//     'ckan_path': '/api/3/action/datastore_upsert'
// }

exports.main = function (arguments){
    
    var m_authid = arguments.m_authid;
    var m_resourceid = arguments.m_resourceid;
    var gps_device = arguments.gps_device;
    
    var winston = require('winston');
    var http = require('http');
    var gpsd = require('node-gpsd');
    
    var daemon = new gpsd.Daemon({
        program: 'gpsd',
        device: gps_device,
        port: 2947,
        pid: '/tmp/gpsd.pid'
    });
    
    daemon.start(function(err, result) {
        console.log('Deamon started'); 
        
        var listener = new gpsd.Listener({
            parse: true,
            parsejson: true
        });
        
        listener.connect(function() {
            console.log('Connected');
            
            listener.watch();
            
            listener.on('TPV', function(data){
                if(data.tag == 'RMC'){
                    delete data.class;
                    delete data.tag;
                    delete data.device;
                    delete data.mode;
                    
                    var record = [];
                    
                    var header = {
                        'Content-Type': "application/json",
                        'Authorization' : m_authid
                    };
                    
                    var options = {
                        host: ckan_host,
                        port: ckan_port,
                        path: ckan_path,
                        method: 'POST',
                        headers: header
                    };
                    
                    record.push(data);
                    
                    var payload = {
                        resource_id : m_resourceid,
                        method: 'insert',
                        records : record
                    };
                    
                    var payloadJSON = JSON.stringify(payload);
                    
                    var req = http.request(options, function(res) {
                        
                        res.setEncoding('utf-8');
                        
                        var responseString = '';
                        
                        res.on('data', function(data) {
                            //responseString += data;
                            //console.log('On Data: '+ responseString);
                        });
                        
                        res.on('end', function() {
                            //var resultObject = JSON.parse(responseString);
                            //console.log('On End: ');
                            //console.dir(resultObject);
                        });
                    });
                    
                    req.on('error', function(e) {
                        console.log('On Error:'+e);
                    });
                    
                    req.write(payloadJSON);
                    
                    req.end();
                    
                    console.log("sent to CKAN, JSON: %j", data);
                };
            });        
        });
    });
}