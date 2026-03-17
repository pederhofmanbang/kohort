// Kohort-databas: all patientdata + query-engine
// Detta är "databasen" som Claude söker i via tool_use

var PATIENTS = [{"id":1,"a":64,"r":"intermediate_fav","g":"3+4=7","p":11.0,"t":"EBRT","o":"curative_good","d":"T2","dd":22,"h":62,"b":30.2,"e":76,"ht":1,"rt":1,"nf":1,"kd":1},{"id":2,"a":57,"r":"intermediate_fav","g":"3+4=7","p":8.0,"t":"RALP","o":"curative_good","d":"T2","dd":7,"h":70,"b":31.2,"e":78,"ht":0,"rt":0,"nf":0,"kd":0},{"id":3,"a":64,"r":"very_high_metastatic","g":"5+4=9","p":183.0,"t":"EBRT_ADT","o":"deceased_other","d":"T1","dd":27,"h":50,"b":22.3,"e":61,"ht":1,"rt":1,"nf":0,"kd":0},{"id":4,"a":54,"r":"very_low","g":"3+3=6","p":3.8,"t":"active_surveillance","o":"stable_AS","d":"T1","dd":27,"h":47,"b":26.9,"e":68,"ht":1,"rt":1,"nf":0,"kd":0},{"id":5,"a":58,"r":"high","g":"4+4=8","p":22.1,"t":"RALP_adj","o":"curative_side_effects","d":"T2","dd":22,"h":68,"b":32.0,"e":60,"ht":1,"rt":1,"nf":1,"kd":0},{"id":6,"a":60,"r":"intermediate_unfav","g":"4+3=7","p":13.9,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":16,"h":51,"b":33.2,"e":59,"ht":0,"rt":0,"nf":0,"kd":0},{"id":7,"a":57,"r":"very_low","g":"3+3=6","p":5.6,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":13,"h":61,"b":32.7,"e":42,"ht":1,"rt":0,"nf":0,"kd":0},{"id":8,"a":60,"r":"high","g":"4+3=7","p":24.2,"t":"RALP_adj","o":"local_progression","d":"T2","dd":15,"h":55,"b":31.3,"e":84,"ht":0,"rt":0,"nf":0,"kd":0},{"id":9,"a":53,"r":"low","g":"3+3=6","p":3.5,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":5,"h":58,"b":29.0,"e":84,"ht":1,"rt":0,"nf":1,"kd":0},{"id":10,"a":52,"r":"high","g":"4+4=8","p":27.7,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":10,"h":59,"b":28.1,"e":110,"ht":1,"rt":0,"nf":0,"kd":0},{"id":11,"a":58,"r":"high","g":"4+3=7","p":28.8,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":21,"h":57,"b":30.7,"e":79,"ht":1,"rt":1,"nf":1,"kd":0},{"id":12,"a":58,"r":"low","g":"3+3=6","p":5.3,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":18,"h":63,"b":29.4,"e":77,"ht":0,"rt":1,"nf":0,"kd":0},{"id":13,"a":50,"r":"intermediate_unfav","g":"3+4=7","p":8.7,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":12,"h":46,"b":29.5,"e":44,"ht":0,"rt":0,"nf":0,"kd":0},{"id":14,"a":54,"r":"intermediate_unfav","g":"4+3=7","p":17.9,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":8,"h":72,"b":29.0,"e":80,"ht":0,"rt":0,"nf":0,"kd":0},{"id":15,"a":52,"r":"high","g":"4+3=7","p":30.5,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":8,"h":77,"b":29.9,"e":118,"ht":0,"rt":0,"nf":1,"kd":0},{"id":16,"a":53,"r":"intermediate_unfav","g":"3+4=7","p":13.5,"t":"EBRT_ADT","o":"local_progression","d":"T1","dd":23,"h":49,"b":26.6,"e":53,"ht":0,"rt":0,"nf":0,"kd":0},{"id":17,"a":62,"r":"intermediate_unfav","g":"4+3=7","p":6.5,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":24,"h":46,"b":31.3,"e":69,"ht":1,"rt":1,"nf":0,"kd":0},{"id":18,"a":52,"r":"very_high_metastatic","g":"5+4=9","p":67.8,"t":"palliative","o":"partial_response","d":"T2","dd":17,"h":69,"b":28.6,"e":71,"ht":0,"rt":0,"nf":0,"kd":0},{"id":19,"a":65,"r":"high","g":"4+4=8","p":30.6,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":20,"h":57,"b":29.3,"e":40,"ht":1,"rt":0,"nf":0,"kd":0},{"id":20,"a":65,"r":"intermediate_fav","g":"3+4=7","p":6.3,"t":"EBRT","o":"curative_good","d":"T1","dd":34,"h":65,"b":26.2,"e":65,"ht":1,"rt":1,"nf":0,"kd":0},{"id":21,"a":59,"r":"intermediate_fav","g":"3+4=7","p":5.9,"t":"EBRT","o":"curative_side_effects","d":"T2","dd":5,"h":66,"b":30.7,"e":72,"ht":1,"rt":0,"nf":0,"kd":0},{"id":22,"a":61,"r":"low","g":"3+3=6","p":3.9,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":22,"h":68,"b":32.6,"e":59,"ht":1,"rt":0,"nf":0,"kd":0},{"id":23,"a":57,"r":"intermediate_fav","g":"3+4=7","p":6.8,"t":"RALP","o":"curative_good","d":"T1","dd":39,"h":45,"b":30.1,"e":42,"ht":1,"rt":0,"nf":1,"kd":0},{"id":24,"a":55,"r":"very_high_metastatic","g":"4+4=8","p":119.8,"t":"EBRT_ADT","o":"deceased_cancer","d":"T2","dd":15,"h":59,"b":24.4,"e":70,"ht":1,"rt":1,"nf":0,"kd":0},{"id":25,"a":61,"r":"high","g":"4+3=7","p":11.4,"t":"RALP_adj","o":"local_progression","d":"T2","dd":23,"h":68,"b":26.3,"e":49,"ht":1,"rt":1,"nf":0,"kd":1},{"id":26,"a":62,"r":"intermediate_unfav","g":"3+4=7","p":13.6,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":15,"h":67,"b":31.2,"e":43,"ht":0,"rt":0,"nf":1,"kd":0},{"id":27,"a":52,"r":"high","g":"4+4=8","p":12.0,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T1","dd":33,"h":50,"b":24.3,"e":82,"ht":1,"rt":1,"nf":0,"kd":0},{"id":28,"a":59,"r":"intermediate_fav","g":"3+4=7","p":8.8,"t":"EBRT","o":"biochemical_recurrence","d":"T2","dd":20,"h":71,"b":34.2,"e":66,"ht":1,"rt":0,"nf":0,"kd":0},{"id":29,"a":55,"r":"very_high_metastatic","g":"5+4=9","p":164.8,"t":"ADT_only","o":"deceased_other","d":"T2","dd":9,"h":71,"b":28.8,"e":65,"ht":1,"rt":0,"nf":0,"kd":0},{"id":30,"a":60,"r":"intermediate_fav","g":"3+4=7","p":11.7,"t":"EBRT","o":"biochemical_recurrence","d":"T2","dd":17,"h":55,"b":31.6,"e":80,"ht":1,"rt":0,"nf":0,"kd":1},{"id":31,"a":53,"r":"very_low","g":"3+3=6","p":5.8,"t":"active_surveillance","o":"reclassified_to_treatment","d":"T2","dd":7,"h":63,"b":27.4,"e":93,"ht":1,"rt":0,"nf":0,"kd":0},{"id":32,"a":53,"r":"intermediate_unfav","g":"4+3=7","p":11.5,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T2","dd":8,"h":64,"b":30.7,"e":64,"ht":1,"rt":1,"nf":0,"kd":0},{"id":33,"a":61,"r":"intermediate_unfav","g":"4+3=7","p":14.2,"t":"RALP","o":"local_progression","d":"T2","dd":3,"h":53,"b":30.3,"e":97,"ht":1,"rt":1,"nf":0,"kd":0},{"id":34,"a":53,"r":"intermediate_unfav","g":"4+3=7","p":8.1,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":2,"h":42,"b":29.9,"e":77,"ht":0,"rt":0,"nf":0,"kd":0},{"id":35,"a":59,"r":"high","g":"4+4=8","p":16.2,"t":"EBRT_ADT","o":"local_progression","d":"T1","dd":37,"h":66,"b":24.1,"e":57,"ht":1,"rt":0,"nf":1,"kd":0},{"id":36,"a":55,"r":"intermediate_fav","g":"3+4=7","p":6.2,"t":"EBRT","o":"curative_good","d":"T1","dd":21,"h":56,"b":20.8,"e":77,"ht":1,"rt":0,"nf":1,"kd":0},{"id":37,"a":57,"r":"very_high_metastatic","g":"4+4=8","p":120.3,"t":"palliative","o":"progression","d":"T2","dd":12,"h":62,"b":36.1,"e":88,"ht":1,"rt":0,"nf":0,"kd":0},{"id":38,"a":60,"r":"intermediate_unfav","g":"4+3=7","p":10.3,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":19,"h":63,"b":30.1,"e":89,"ht":1,"rt":0,"nf":0,"kd":0},{"id":39,"a":51,"r":"very_high_metastatic","g":"4+5=9","p":131.6,"t":"ADT_only","o":"deceased_cancer","d":"T2","dd":6,"h":61,"b":30.1,"e":73,"ht":0,"rt":0,"nf":0,"kd":0},{"id":40,"a":65,"r":"low","g":"3+3=6","p":5.8,"t":"RALP","o":"curative_good","d":"T2","dd":8,"h":52,"b":24.7,"e":87,"ht":1,"rt":0,"nf":0,"kd":0},{"id":41,"a":62,"r":"intermediate_fav","g":"3+4=7","p":7.2,"t":"RALP","o":"curative_good","d":"T2","dd":9,"h":58,"b":28.9,"e":67,"ht":1,"rt":0,"nf":0,"kd":0},{"id":42,"a":63,"r":"low","g":"3+3=6","p":6.6,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":13,"h":57,"b":29.0,"e":99,"ht":0,"rt":0,"nf":0,"kd":0},{"id":43,"a":52,"r":"intermediate_fav","g":"3+4=7","p":8.8,"t":"EBRT","o":"curative_good","d":"T2","dd":13,"h":55,"b":28.3,"e":81,"ht":1,"rt":0,"nf":0,"kd":0},{"id":44,"a":64,"r":"intermediate_fav","g":"3+4=7","p":8.9,"t":"EBRT","o":"curative_good","d":"T2","dd":20,"h":58,"b":30.5,"e":77,"ht":1,"rt":0,"nf":0,"kd":0},{"id":45,"a":59,"r":"low","g":"3+3=6","p":6.0,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":14,"h":66,"b":31.7,"e":49,"ht":1,"rt":0,"nf":0,"kd":1},{"id":46,"a":51,"r":"high","g":"4+4=8","p":26.2,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T1","dd":16,"h":60,"b":29.2,"e":94,"ht":0,"rt":1,"nf":0,"kd":0},{"id":47,"a":52,"r":"intermediate_unfav","g":"3+4=7","p":9.9,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T2","dd":9,"h":53,"b":24.2,"e":70,"ht":1,"rt":0,"nf":1,"kd":0},{"id":48,"a":59,"r":"intermediate_unfav","g":"3+4=7","p":8.7,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":22,"h":55,"b":31.8,"e":82,"ht":1,"rt":0,"nf":0,"kd":1},{"id":49,"a":52,"r":"very_low","g":"3+3=6","p":5.5,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":8,"h":63,"b":25.5,"e":63,"ht":0,"rt":0,"nf":0,"kd":0},{"id":50,"a":62,"r":"intermediate_fav","g":"3+4=7","p":7.2,"t":"EBRT","o":"curative_good","d":"T2","dd":14,"h":65,"b":26.4,"e":73,"ht":1,"rt":1,"nf":0,"kd":1},{"id":51,"a":57,"r":"very_high_metastatic","g":"5+4=9","p":121.5,"t":"ADT_chemo","o":"deceased_other","d":"T2","dd":10,"h":66,"b":29.1,"e":77,"ht":1,"rt":0,"nf":0,"kd":0},{"id":52,"a":59,"r":"intermediate_unfav","g":"3+4=7","p":13.1,"t":"RALP","o":"curative_side_effects","d":"T2","dd":17,"h":55,"b":31.7,"e":86,"ht":0,"rt":0,"nf":0,"kd":1},{"id":53,"a":56,"r":"very_low","g":"3+3=6","p":2.7,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":14,"h":70,"b":29.4,"e":69,"ht":1,"rt":0,"nf":0,"kd":1},{"id":54,"a":57,"r":"intermediate_unfav","g":"4+3=7","p":10.7,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":5,"h":54,"b":32.1,"e":77,"ht":0,"rt":0,"nf":0,"kd":0},{"id":55,"a":54,"r":"low","g":"3+3=6","p":3.0,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":10,"h":61,"b":30.7,"e":69,"ht":1,"rt":1,"nf":1,"kd":0},{"id":56,"a":60,"r":"intermediate_fav","g":"3+4=7","p":6.8,"t":"RALP","o":"curative_good","d":"T2","dd":15,"h":48,"b":29.6,"e":54,"ht":1,"rt":0,"nf":1,"kd":0},{"id":57,"a":53,"r":"intermediate_unfav","g":"4+3=7","p":7.2,"t":"RALP","o":"curative_side_effects","d":"T1","dd":19,"h":53,"b":20.5,"e":70,"ht":0,"rt":1,"nf":0,"kd":0},{"id":58,"a":62,"r":"high","g":"4+3=7","p":17.7,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":12,"h":64,"b":32.3,"e":90,"ht":1,"rt":0,"nf":0,"kd":1},{"id":59,"a":65,"r":"low","g":"3+3=6","p":6.5,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":18,"h":68,"b":33.2,"e":90,"ht":1,"rt":0,"nf":1,"kd":0},{"id":60,"a":61,"r":"intermediate_unfav","g":"3+4=7","p":8.0,"t":"RALP","o":"curative_side_effects","d":"T1","dd":24,"h":69,"b":24.4,"e":56,"ht":1,"rt":0,"nf":0,"kd":0},{"id":61,"a":61,"r":"low","g":"3+3=6","p":6.3,"t":"RALP","o":"curative_good","d":"T2","dd":23,"h":51,"b":30.3,"e":86,"ht":1,"rt":0,"nf":0,"kd":0},{"id":62,"a":59,"r":"very_low","g":"3+3=6","p":5.5,"t":"active_surveillance","o":"reclassified_to_treatment","d":"T2","dd":23,"h":51,"b":27.1,"e":75,"ht":1,"rt":1,"nf":0,"kd":0},{"id":63,"a":61,"r":"very_low","g":"3+3=6","p":2.7,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":14,"h":51,"b":29.9,"e":64,"ht":1,"rt":0,"nf":0,"kd":0},{"id":64,"a":53,"r":"high","g":"4+4=8","p":33.4,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T2","dd":15,"h":54,"b":31.7,"e":61,"ht":1,"rt":0,"nf":0,"kd":0},{"id":65,"a":58,"r":"high","g":"4+3=7","p":13.4,"t":"RALP_adj","o":"local_progression","d":"T2","dd":13,"h":64,"b":32.8,"e":71,"ht":0,"rt":0,"nf":0,"kd":0},{"id":66,"a":51,"r":"low","g":"3+3=6","p":6.8,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":8,"h":56,"b":27.4,"e":80,"ht":0,"rt":0,"nf":0,"kd":0},{"id":67,"a":53,"r":"high","g":"4+3=7","p":37.8,"t":"RALP_adj","o":"biochemical_recurrence","d":"T2","dd":7,"h":72,"b":23.2,"e":55,"ht":0,"rt":0,"nf":0,"kd":0},{"id":68,"a":57,"r":"intermediate_fav","g":"3+4=7","p":6.4,"t":"RALP","o":"curative_good","d":"T1","dd":31,"h":51,"b":29.9,"e":74,"ht":0,"rt":1,"nf":0,"kd":0},{"id":69,"a":62,"r":"very_high_metastatic","g":"4+5=9","p":159.3,"t":"palliative","o":"deceased_cancer","d":"T2","dd":10,"h":76,"b":31.6,"e":85,"ht":1,"rt":0,"nf":0,"kd":0},{"id":70,"a":56,"r":"low","g":"3+3=6","p":7.5,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":21,"h":71,"b":33.6,"e":52,"ht":0,"rt":0,"nf":0,"kd":0},{"id":71,"a":52,"r":"very_low","g":"3+3=6","p":3.6,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":5,"h":50,"b":30.9,"e":42,"ht":0,"rt":1,"nf":0,"kd":0},{"id":72,"a":55,"r":"very_high_metastatic","g":"4+5=9","p":192.6,"t":"EBRT_ADT","o":"deceased_cancer","d":"T1","dd":31,"h":53,"b":20,"e":76,"ht":1,"rt":1,"nf":0,"kd":0},{"id":73,"a":52,"r":"intermediate_unfav","g":"4+3=7","p":7.6,"t":"EBRT_ADT","o":"curative_good","d":"T1","dd":32,"h":56,"b":31.2,"e":76,"ht":1,"rt":1,"nf":1,"kd":0},{"id":74,"a":55,"r":"very_high_metastatic","g":"4+4=8","p":166.0,"t":"palliative","o":"deceased_other","d":"T1","dd":24,"h":53,"b":23.1,"e":74,"ht":1,"rt":1,"nf":0,"kd":0},{"id":75,"a":50,"r":"intermediate_unfav","g":"3+4=7","p":10.6,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":8,"h":51,"b":27.9,"e":73,"ht":0,"rt":0,"nf":0,"kd":0},{"id":76,"a":53,"r":"very_high_metastatic","g":"5+4=9","p":94.4,"t":"ADT_chemo","o":"deceased_cancer","d":"T2","dd":3,"h":62,"b":25.4,"e":66,"ht":0,"rt":0,"nf":0,"kd":0},{"id":77,"a":60,"r":"intermediate_fav","g":"3+4=7","p":11.5,"t":"RALP","o":"curative_good","d":"T2","dd":5,"h":64,"b":30.0,"e":77,"ht":0,"rt":0,"nf":0,"kd":0},{"id":78,"a":56,"r":"high","g":"4+4=8","p":29.0,"t":"RALP_adj","o":"curative_side_effects","d":"T2","dd":21,"h":56,"b":30.5,"e":64,"ht":1,"rt":0,"nf":0,"kd":0},{"id":79,"a":56,"r":"high","g":"4+4=8","p":11.0,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":14,"h":65,"b":27.6,"e":74,"ht":1,"rt":0,"nf":0,"kd":0},{"id":80,"a":58,"r":"high","g":"4+4=8","p":13.0,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":19,"h":71,"b":31.0,"e":58,"ht":1,"rt":0,"nf":0,"kd":0},{"id":81,"a":59,"r":"intermediate_unfav","g":"4+3=7","p":8.0,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":19,"h":45,"b":24.7,"e":80,"ht":1,"rt":1,"nf":1,"kd":0},{"id":82,"a":51,"r":"intermediate_fav","g":"3+4=7","p":8.7,"t":"RALP","o":"curative_side_effects","d":"T2","dd":9,"h":54,"b":30.0,"e":77,"ht":1,"rt":0,"nf":0,"kd":0},{"id":83,"a":52,"r":"intermediate_fav","g":"3+4=7","p":6.9,"t":"RALP","o":"curative_side_effects","d":"T2","dd":9,"h":56,"b":34.8,"e":97,"ht":0,"rt":0,"nf":1,"kd":0},{"id":84,"a":58,"r":"very_high_metastatic","g":"4+4=8","p":125.2,"t":"ADT_chemo","o":"partial_response","d":"T2","dd":16,"h":68,"b":29.3,"e":64,"ht":0,"rt":0,"nf":0,"kd":0},{"id":85,"a":65,"r":"very_high_metastatic","g":"5+4=9","p":159.7,"t":"ADT_chemo","o":"partial_response","d":"T2","dd":5,"h":54,"b":27.8,"e":82,"ht":1,"rt":0,"nf":1,"kd":0},{"id":86,"a":52,"r":"very_low","g":"3+3=6","p":3.2,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":16,"h":54,"b":31.5,"e":93,"ht":1,"rt":0,"nf":0,"kd":0},{"id":87,"a":55,"r":"intermediate_unfav","g":"3+4=7","p":10.3,"t":"RALP","o":"curative_side_effects","d":"T2","dd":4,"h":57,"b":31.5,"e":70,"ht":0,"rt":0,"nf":0,"kd":0},{"id":88,"a":56,"r":"high","g":"4+3=7","p":30.9,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":6,"h":61,"b":32.9,"e":82,"ht":1,"rt":1,"nf":0,"kd":0},{"id":89,"a":57,"r":"low","g":"3+3=6","p":4.7,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":9,"h":50,"b":36.1,"e":81,"ht":0,"rt":1,"nf":0,"kd":0},{"id":90,"a":51,"r":"high","g":"4+3=7","p":25.0,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T2","dd":12,"h":72,"b":27.5,"e":91,"ht":1,"rt":1,"nf":0,"kd":0},{"id":91,"a":60,"r":"very_high_metastatic","g":"5+4=9","p":157.8,"t":"palliative","o":"deceased_cancer","d":"T2","dd":23,"h":58,"b":26.4,"e":79,"ht":1,"rt":0,"nf":1,"kd":1},{"id":92,"a":52,"r":"low","g":"3+3=6","p":5.5,"t":"RALP","o":"curative_good","d":"T2","dd":2,"h":76,"b":33.6,"e":79,"ht":0,"rt":0,"nf":0,"kd":0},{"id":93,"a":59,"r":"low","g":"3+3=6","p":3.5,"t":"active_surveillance","o":"reclassified_to_treatment","d":"T2","dd":15,"h":57,"b":29.3,"e":73,"ht":1,"rt":0,"nf":0,"kd":1},{"id":94,"a":50,"r":"intermediate_fav","g":"3+4=7","p":5.6,"t":"RALP","o":"curative_side_effects","d":"T2","dd":8,"h":57,"b":30.4,"e":67,"ht":0,"rt":0,"nf":0,"kd":0},{"id":95,"a":52,"r":"intermediate_fav","g":"3+4=7","p":9.3,"t":"RALP","o":"curative_good","d":"T2","dd":14,"h":57,"b":27.7,"e":72,"ht":1,"rt":0,"nf":0,"kd":0},{"id":96,"a":60,"r":"intermediate_fav","g":"3+4=7","p":10.8,"t":"EBRT","o":"curative_side_effects","d":"T2","dd":24,"h":61,"b":32.1,"e":58,"ht":1,"rt":0,"nf":1,"kd":1},{"id":97,"a":54,"r":"very_high_metastatic","g":"5+4=9","p":69.1,"t":"ADT_only","o":"partial_response","d":"T2","dd":3,"h":57,"b":32.5,"e":75,"ht":1,"rt":0,"nf":0,"kd":0},{"id":98,"a":51,"r":"very_low","g":"3+3=6","p":4.9,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":2,"h":65,"b":28.0,"e":92,"ht":0,"rt":0,"nf":0,"kd":0},{"id":99,"a":64,"r":"low","g":"3+3=6","p":4.0,"t":"RALP","o":"curative_good","d":"T2","dd":22,"h":51,"b":27.4,"e":78,"ht":1,"rt":1,"nf":0,"kd":1},{"id":100,"a":54,"r":"high","g":"4+4=8","p":18.7,"t":"RALP_adj","o":"biochemical_recurrence","d":"T2","dd":2,"h":54,"b":32.0,"e":51,"ht":0,"rt":0,"nf":0,"kd":0}];

var FIELD_LABELS = {
  a: "Ålder (år)", r: "Riskgrupp", g: "Gleason", p: "PSA vid diagnos (ng/mL)",
  t: "Behandling", o: "Utfall", d: "Diabetestyp", dd: "Diabetesduration (år)",
  h: "HbA1c (mmol/mol)", b: "BMI", e: "eGFR (mL/min/1.73m²)",
  ht: "Hypertoni (0/1)", rt: "Retinopati (0/1)", nf: "Nefropati (0/1)", kd: "Kardiovaskulär sjukdom (0/1)"
};

var CATEGORICAL = ["r","g","t","o","d"];
var NUMERIC = ["a","p","dd","h","b","e"];
var BINARY = ["ht","rt","nf","kd"];

// ========== QUERY ENGINE ==========

function applyFilters(patients, filters) {
  if (!filters || Object.keys(filters).length === 0) return patients;
  return patients.filter(function(p) {
    return Object.keys(filters).every(function(field) {
      var cond = filters[field];
      var val = p[field];
      if (cond === undefined || cond === null) return true;
      // Exakt match (string/number)
      if (typeof cond === "string" || typeof cond === "number") return String(val) === String(cond);
      // Array = any of
      if (Array.isArray(cond)) return cond.map(String).indexOf(String(val)) >= 0;
      // Range object: { min, max }
      if (typeof cond === "object" && (cond.min !== undefined || cond.max !== undefined)) {
        var num = Number(val);
        if (cond.min !== undefined && num < cond.min) return false;
        if (cond.max !== undefined && num > cond.max) return false;
        return true;
      }
      return String(val) === String(cond);
    });
  });
}

function searchPatients(filters, fields, limit) {
  var results = applyFilters(PATIENTS, filters);
  var lim = limit || 20;
  var limited = results.slice(0, lim);
  var output = limited.map(function(p) {
    if (fields && fields.length > 0) {
      var obj = { id: p.id };
      fields.forEach(function(f) { obj[f] = p[f]; });
      return obj;
    }
    return p;
  });
  return { total_matches: results.length, returned: output.length, patients: output };
}

function getStatistics(field, groupBy, filters) {
  var data = applyFilters(PATIENTS, filters);
  if (CATEGORICAL.indexOf(field) >= 0 || BINARY.indexOf(field) >= 0) {
    // Frequency distribution
    var counts = {};
    data.forEach(function(p) {
      var k = String(p[field]);
      counts[k] = (counts[k] || 0) + 1;
    });
    return { field: field, label: FIELD_LABELS[field], type: "distribution", n: data.length, distribution: counts };
  }
  if (NUMERIC.indexOf(field) >= 0) {
    if (groupBy) {
      // Numeric stats grouped by a categorical field
      var groups = {};
      data.forEach(function(p) {
        var g = String(p[groupBy]);
        if (!groups[g]) groups[g] = [];
        groups[g].push(p[field]);
      });
      var grouped = {};
      Object.keys(groups).forEach(function(g) {
        var vals = groups[g];
        vals.sort(function(a,b){return a-b;});
        var sum = vals.reduce(function(s,v){return s+v;},0);
        grouped[g] = {
          n: vals.length,
          mean: Math.round(sum / vals.length * 10) / 10,
          median: vals[Math.floor(vals.length/2)],
          min: vals[0],
          max: vals[vals.length-1]
        };
      });
      return { field: field, label: FIELD_LABELS[field], group_by: groupBy, group_label: FIELD_LABELS[groupBy], type: "grouped_numeric", groups: grouped };
    }
    // Simple numeric stats
    var vals = data.map(function(p) { return p[field]; });
    vals.sort(function(a,b){return a-b;});
    var sum = vals.reduce(function(s,v){return s+v;},0);
    return {
      field: field, label: FIELD_LABELS[field], type: "numeric", n: vals.length,
      mean: Math.round(sum / vals.length * 10) / 10,
      median: vals[Math.floor(vals.length/2)],
      min: vals[0], max: vals[vals.length-1],
      std: Math.round(Math.sqrt(vals.reduce(function(s,v){return s + Math.pow(v - sum/vals.length, 2);},0) / vals.length) * 10) / 10
    };
  }
  return { error: "Unknown field: " + field };
}

function countPatients(filters) {
  var data = applyFilters(PATIENTS, filters);
  return { count: data.length, total: PATIENTS.length, percentage: Math.round(data.length / PATIENTS.length * 1000) / 10 };
}

function crossTabulate(field1, field2, filters) {
  var data = applyFilters(PATIENTS, filters);
  var table = {};
  var vals1 = {};
  var vals2 = {};
  data.forEach(function(p) {
    var v1 = String(p[field1]);
    var v2 = String(p[field2]);
    vals1[v1] = true;
    vals2[v2] = true;
    if (!table[v1]) table[v1] = {};
    table[v1][v2] = (table[v1][v2] || 0) + 1;
  });
  return {
    field1: field1, label1: FIELD_LABELS[field1],
    field2: field2, label2: FIELD_LABELS[field2],
    n: data.length,
    values_field1: Object.keys(vals1).sort(),
    values_field2: Object.keys(vals2).sort(),
    table: table
  };
}

// Export for use in cohort-chat.js
module.exports = {
  PATIENTS: PATIENTS,
  FIELD_LABELS: FIELD_LABELS,
  CATEGORICAL: CATEGORICAL,
  NUMERIC: NUMERIC,
  BINARY: BINARY,
  searchPatients: searchPatients,
  getStatistics: getStatistics,
  countPatients: countPatients,
  crossTabulate: crossTabulate
};
