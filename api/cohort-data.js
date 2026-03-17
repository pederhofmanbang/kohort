// Kohort-databas: all patientdata + query-engine
// Detta är "databasen" som Claude söker i via tool_use

var PATIENTS = [{"id":1,"a":64,"r":"intermediate_fav","g":"3+4=7","p":11,"t":"EBRT","o":"curative_good","d":"T2","dd":22,"h":62,"b":30.2,"e":76,"ht":1,"rt":1,"nf":1,"kd":1,"psa_series":{"baseline":11,"3mo":2.64,"6mo":1.12,"12mo":0.23,"24mo":0.19},"hba1c_series":{"baseline":62,"6mo":61,"12mo":64,"24mo":62},"egfr_series":{"baseline":76,"6mo":75,"12mo":72,"24mo":69}},{"id":2,"a":57,"r":"intermediate_fav","g":"3+4=7","p":8,"t":"RALP","o":"curative_good","d":"T2","dd":7,"h":70,"b":31.2,"e":78,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":8,"3mo":0.05,"6mo":0.04,"12mo":0.03,"24mo":0.04},"hba1c_series":{"baseline":70,"6mo":69,"12mo":69,"24mo":67},"egfr_series":{"baseline":78,"6mo":78,"12mo":77,"24mo":77}},{"id":3,"a":64,"r":"very_high_metastatic","g":"5+4=9","p":183,"t":"EBRT_ADT","o":"deceased_other","d":"T1","dd":27,"h":50,"b":22.3,"e":61,"ht":1,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":183,"3mo":60.1,"6mo":13.67,"12mo":3.12,"24mo":10.59},"hba1c_series":{"baseline":50,"6mo":56,"12mo":55,"24mo":56},"egfr_series":{"baseline":61,"6mo":60,"12mo":57,"24mo":54}},{"id":4,"a":54,"r":"very_low","g":"3+3=6","p":3.8,"t":"active_surveillance","o":"stable_AS","d":"T1","dd":27,"h":47,"b":26.9,"e":68,"ht":1,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":3.8,"3mo":3.62,"6mo":4.07,"12mo":4.16,"24mo":4.37},"hba1c_series":{"baseline":47,"6mo":48,"12mo":48,"24mo":47},"egfr_series":{"baseline":68,"6mo":67,"12mo":66,"24mo":65}},{"id":5,"a":58,"r":"high","g":"4+4=8","p":22.1,"t":"RALP_adj","o":"curative_side_effects","d":"T2","dd":22,"h":68,"b":32,"e":60,"ht":1,"rt":1,"nf":1,"kd":0,"psa_series":{"baseline":22.1,"3mo":0.05,"6mo":0.03,"12mo":0.02,"24mo":0.05},"hba1c_series":{"baseline":68,"6mo":68,"12mo":67,"24mo":66},"egfr_series":{"baseline":60,"6mo":57,"12mo":59,"24mo":55}},{"id":6,"a":60,"r":"intermediate_unfav","g":"4+3=7","p":13.9,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":16,"h":51,"b":33.2,"e":59,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":13.9,"3mo":3.48,"6mo":1.8,"12mo":0.99,"24mo":5.64},"hba1c_series":{"baseline":51,"6mo":52,"12mo":57,"24mo":63},"egfr_series":{"baseline":59,"6mo":57,"12mo":57,"24mo":53}},{"id":7,"a":57,"r":"very_low","g":"3+3=6","p":5.6,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":13,"h":61,"b":32.7,"e":42,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":5.6,"3mo":5.57,"6mo":5.85,"12mo":5.69,"24mo":6.47},"hba1c_series":{"baseline":61,"6mo":60,"12mo":60,"24mo":60},"egfr_series":{"baseline":42,"6mo":42,"12mo":40,"24mo":38}},{"id":8,"a":60,"r":"high","g":"4+3=7","p":24.2,"t":"RALP_adj","o":"local_progression","d":"T2","dd":15,"h":55,"b":31.3,"e":84,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":24.2,"3mo":0.04,"6mo":0.03,"12mo":0.91,"24mo":5.81},"hba1c_series":{"baseline":55,"6mo":56,"12mo":54,"24mo":56},"egfr_series":{"baseline":84,"6mo":85,"12mo":83,"24mo":81}},{"id":9,"a":53,"r":"low","g":"3+3=6","p":3.5,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":5,"h":58,"b":29,"e":84,"ht":1,"rt":0,"nf":1,"kd":0,"psa_series":{"baseline":3.5,"3mo":3.65,"6mo":3.56,"12mo":3.85,"24mo":3.74},"hba1c_series":{"baseline":58,"6mo":60,"12mo":59,"24mo":59},"egfr_series":{"baseline":84,"6mo":84,"12mo":81,"24mo":78}},{"id":10,"a":52,"r":"high","g":"4+4=8","p":27.7,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":10,"h":59,"b":28.1,"e":110,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":27.7,"3mo":7.79,"6mo":2.46,"12mo":1,"24mo":5.23},"hba1c_series":{"baseline":59,"6mo":64,"12mo":60,"24mo":65},"egfr_series":{"baseline":110,"6mo":109,"12mo":106,"24mo":106}},{"id":11,"a":58,"r":"high","g":"4+3=7","p":28.8,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":21,"h":57,"b":30.7,"e":79,"ht":1,"rt":1,"nf":1,"kd":0,"psa_series":{"baseline":28.8,"3mo":8.25,"6mo":2.79,"12mo":0.04,"24mo":0.03},"hba1c_series":{"baseline":57,"6mo":60,"12mo":60,"24mo":62},"egfr_series":{"baseline":79,"6mo":76,"12mo":74,"24mo":72}},{"id":12,"a":58,"r":"low","g":"3+3=6","p":5.3,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":18,"h":63,"b":29.4,"e":77,"ht":0,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":5.3,"3mo":0.06,"6mo":0.02,"12mo":0.79,"24mo":2.98},"hba1c_series":{"baseline":63,"6mo":62,"12mo":63,"24mo":61},"egfr_series":{"baseline":77,"6mo":77,"12mo":75,"24mo":72}},{"id":13,"a":50,"r":"intermediate_unfav","g":"3+4=7","p":8.7,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":12,"h":46,"b":29.5,"e":44,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":8.7,"3mo":2.71,"6mo":0.78,"12mo":0.03,"24mo":0.03},"hba1c_series":{"baseline":46,"6mo":48,"12mo":52,"24mo":49},"egfr_series":{"baseline":44,"6mo":42,"12mo":43,"24mo":37}},{"id":14,"a":54,"r":"intermediate_unfav","g":"4+3=7","p":17.9,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":8,"h":72,"b":29,"e":80,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":17.9,"3mo":0.05,"6mo":0.03,"12mo":0.98,"24mo":1.94},"hba1c_series":{"baseline":72,"6mo":71,"12mo":71,"24mo":70},"egfr_series":{"baseline":80,"6mo":81,"12mo":80,"24mo":78}},{"id":15,"a":52,"r":"high","g":"4+3=7","p":30.5,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":8,"h":77,"b":29.9,"e":118,"ht":0,"rt":0,"nf":1,"kd":0,"psa_series":{"baseline":30.5,"3mo":9.21,"6mo":3.03,"12mo":0.03,"24mo":0.03},"hba1c_series":{"baseline":77,"6mo":79,"12mo":81,"24mo":82},"egfr_series":{"baseline":118,"6mo":115,"12mo":113,"24mo":108}},{"id":16,"a":53,"r":"intermediate_unfav","g":"3+4=7","p":13.5,"t":"EBRT_ADT","o":"local_progression","d":"T1","dd":23,"h":49,"b":26.6,"e":53,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":13.5,"3mo":4.42,"6mo":1.28,"12mo":0.73,"24mo":4.58},"hba1c_series":{"baseline":49,"6mo":53,"12mo":52,"24mo":60},"egfr_series":{"baseline":53,"6mo":53,"12mo":52,"24mo":49}},{"id":17,"a":62,"r":"intermediate_unfav","g":"4+3=7","p":6.5,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":24,"h":46,"b":31.3,"e":69,"ht":1,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":6.5,"3mo":1.74,"6mo":0.65,"12mo":0.02,"24mo":0.04},"hba1c_series":{"baseline":46,"6mo":52,"12mo":55,"24mo":51},"egfr_series":{"baseline":69,"6mo":68,"12mo":67,"24mo":66}},{"id":18,"a":52,"r":"very_high_metastatic","g":"5+4=9","p":67.8,"t":"palliative","o":"partial_response","d":"T2","dd":17,"h":69,"b":28.6,"e":71,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":67.8,"3mo":40.3,"6mo":37.56,"12mo":26.4,"24mo":17.43},"hba1c_series":{"baseline":69,"6mo":68,"12mo":67,"24mo":69},"egfr_series":{"baseline":71,"6mo":69,"12mo":70,"24mo":67}},{"id":19,"a":65,"r":"high","g":"4+4=8","p":30.6,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":20,"h":57,"b":29.3,"e":40,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":30.6,"3mo":10.26,"6mo":2.6,"12mo":0.85,"24mo":4.54},"hba1c_series":{"baseline":57,"6mo":63,"12mo":61,"24mo":69},"egfr_series":{"baseline":40,"6mo":39,"12mo":37,"24mo":36}},{"id":20,"a":65,"r":"intermediate_fav","g":"3+4=7","p":6.3,"t":"EBRT","o":"curative_good","d":"T1","dd":34,"h":65,"b":26.2,"e":65,"ht":1,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":6.3,"3mo":2.22,"6mo":0.63,"12mo":0.2,"24mo":0.17},"hba1c_series":{"baseline":65,"6mo":64,"12mo":66,"24mo":66},"egfr_series":{"baseline":65,"6mo":64,"12mo":63,"24mo":61}},{"id":21,"a":59,"r":"intermediate_fav","g":"3+4=7","p":5.9,"t":"EBRT","o":"curative_side_effects","d":"T2","dd":5,"h":66,"b":30.7,"e":72,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":5.9,"3mo":1.99,"6mo":0.58,"12mo":0.22,"24mo":0.22},"hba1c_series":{"baseline":66,"6mo":66,"12mo":66,"24mo":64},"egfr_series":{"baseline":72,"6mo":72,"12mo":70,"24mo":67}},{"id":22,"a":61,"r":"low","g":"3+3=6","p":3.9,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":22,"h":68,"b":32.6,"e":59,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":3.9,"3mo":0.04,"6mo":0.04,"12mo":1.1,"24mo":2.55},"hba1c_series":{"baseline":68,"6mo":68,"12mo":67,"24mo":67},"egfr_series":{"baseline":59,"6mo":58,"12mo":57,"24mo":58}},{"id":23,"a":57,"r":"intermediate_fav","g":"3+4=7","p":6.8,"t":"RALP","o":"curative_good","d":"T1","dd":39,"h":45,"b":30.1,"e":42,"ht":1,"rt":0,"nf":1,"kd":0,"psa_series":{"baseline":6.8,"3mo":0.05,"6mo":0.04,"12mo":0.03,"24mo":0.03},"hba1c_series":{"baseline":45,"6mo":45,"12mo":46,"24mo":44},"egfr_series":{"baseline":42,"6mo":41,"12mo":40,"24mo":38}},{"id":24,"a":55,"r":"very_high_metastatic","g":"4+4=8","p":119.8,"t":"EBRT_ADT","o":"deceased_cancer","d":"T2","dd":15,"h":59,"b":24.4,"e":70,"ht":1,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":119.8,"3mo":33.59,"6mo":14.74,"12mo":4.15,"24mo":14.45},"hba1c_series":{"baseline":59,"6mo":62,"12mo":68,"24mo":59},"egfr_series":{"baseline":70,"6mo":67,"12mo":67,"24mo":65}},{"id":25,"a":61,"r":"high","g":"4+3=7","p":11.4,"t":"RALP_adj","o":"local_progression","d":"T2","dd":23,"h":68,"b":26.3,"e":49,"ht":1,"rt":1,"nf":0,"kd":1,"psa_series":{"baseline":11.4,"3mo":0.04,"6mo":0.03,"12mo":1.32,"24mo":4.73},"hba1c_series":{"baseline":68,"6mo":67,"12mo":69,"24mo":70},"egfr_series":{"baseline":49,"6mo":50,"12mo":48,"24mo":45}},{"id":26,"a":62,"r":"intermediate_unfav","g":"3+4=7","p":13.6,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":15,"h":67,"b":31.2,"e":43,"ht":0,"rt":0,"nf":1,"kd":0,"psa_series":{"baseline":13.6,"3mo":3.99,"6mo":1.75,"12mo":0.04,"24mo":0.03},"hba1c_series":{"baseline":67,"6mo":68,"12mo":78,"24mo":78},"egfr_series":{"baseline":43,"6mo":41,"12mo":38,"24mo":33}},{"id":27,"a":52,"r":"high","g":"4+4=8","p":12,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T1","dd":33,"h":50,"b":24.3,"e":82,"ht":1,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":12,"3mo":4.22,"6mo":1.29,"12mo":0.66,"24mo":2.9},"hba1c_series":{"baseline":50,"6mo":56,"12mo":52,"24mo":56},"egfr_series":{"baseline":82,"6mo":79,"12mo":79,"24mo":76}},{"id":28,"a":59,"r":"intermediate_fav","g":"3+4=7","p":8.8,"t":"EBRT","o":"biochemical_recurrence","d":"T2","dd":20,"h":71,"b":34.2,"e":66,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":8.8,"3mo":2.56,"6mo":1,"12mo":0.79,"24mo":2.28},"hba1c_series":{"baseline":71,"6mo":72,"12mo":72,"24mo":71},"egfr_series":{"baseline":66,"6mo":66,"12mo":66,"24mo":62}},{"id":29,"a":55,"r":"very_high_metastatic","g":"5+4=9","p":164.8,"t":"ADT_only","o":"deceased_other","d":"T2","dd":9,"h":71,"b":28.8,"e":65,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":164.8,"3mo":13.66,"6mo":3.82,"12mo":0.01,"24mo":0.02},"hba1c_series":{"baseline":71,"6mo":71,"12mo":78,"24mo":72},"egfr_series":{"baseline":65,"6mo":64,"12mo":62,"24mo":58}},{"id":30,"a":60,"r":"intermediate_fav","g":"3+4=7","p":11.7,"t":"EBRT","o":"biochemical_recurrence","d":"T2","dd":17,"h":55,"b":31.6,"e":80,"ht":1,"rt":0,"nf":0,"kd":1,"psa_series":{"baseline":11.7,"3mo":3.56,"6mo":1.09,"12mo":0.66,"24mo":3.4},"hba1c_series":{"baseline":55,"6mo":53,"12mo":54,"24mo":55},"egfr_series":{"baseline":80,"6mo":80,"12mo":79,"24mo":75}},{"id":31,"a":53,"r":"very_low","g":"3+3=6","p":5.8,"t":"active_surveillance","o":"reclassified_to_treatment","d":"T2","dd":7,"h":63,"b":27.4,"e":93,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":5.8,"3mo":6.75,"6mo":7.36,"12mo":8.59,"24mo":11.89},"hba1c_series":{"baseline":63,"6mo":61,"12mo":62,"24mo":64},"egfr_series":{"baseline":93,"6mo":91,"12mo":90,"24mo":92}},{"id":32,"a":53,"r":"intermediate_unfav","g":"4+3=7","p":11.5,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T2","dd":8,"h":64,"b":30.7,"e":64,"ht":1,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":11.5,"3mo":3.81,"6mo":0.87,"12mo":0.65,"24mo":2.61},"hba1c_series":{"baseline":64,"6mo":67,"12mo":72,"24mo":77},"egfr_series":{"baseline":64,"6mo":62,"12mo":62,"24mo":58}},{"id":33,"a":61,"r":"intermediate_unfav","g":"4+3=7","p":14.2,"t":"RALP","o":"local_progression","d":"T2","dd":3,"h":53,"b":30.3,"e":97,"ht":1,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":14.2,"3mo":0.04,"6mo":0.03,"12mo":0.99,"24mo":4.24},"hba1c_series":{"baseline":53,"6mo":53,"12mo":53,"24mo":54},"egfr_series":{"baseline":97,"6mo":96,"12mo":96,"24mo":95}},{"id":34,"a":53,"r":"intermediate_unfav","g":"4+3=7","p":8.1,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":2,"h":42,"b":29.9,"e":77,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":8.1,"3mo":0.03,"6mo":0.04,"12mo":0.98,"24mo":3.07},"hba1c_series":{"baseline":42,"6mo":42,"12mo":42,"24mo":41},"egfr_series":{"baseline":77,"6mo":76,"12mo":77,"24mo":77}},{"id":35,"a":59,"r":"high","g":"4+4=8","p":16.2,"t":"EBRT_ADT","o":"local_progression","d":"T1","dd":37,"h":66,"b":24.1,"e":57,"ht":1,"rt":0,"nf":1,"kd":0,"psa_series":{"baseline":16.2,"3mo":5.5,"6mo":1.74,"12mo":1.04,"24mo":3.54},"hba1c_series":{"baseline":66,"6mo":74,"12mo":72,"24mo":68},"egfr_series":{"baseline":57,"6mo":56,"12mo":52,"24mo":49}},{"id":36,"a":55,"r":"intermediate_fav","g":"3+4=7","p":6.2,"t":"EBRT","o":"curative_good","d":"T1","dd":21,"h":56,"b":20.8,"e":77,"ht":1,"rt":0,"nf":1,"kd":0,"psa_series":{"baseline":6.2,"3mo":1.6,"6mo":0.49,"12mo":0.18,"24mo":0.28},"hba1c_series":{"baseline":56,"6mo":57,"12mo":57,"24mo":56},"egfr_series":{"baseline":77,"6mo":76,"12mo":75,"24mo":72}},{"id":37,"a":57,"r":"very_high_metastatic","g":"4+4=8","p":120.3,"t":"palliative","o":"progression","d":"T2","dd":12,"h":62,"b":36.1,"e":88,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":120.3,"3mo":74.73,"6mo":68.79,"12mo":79.21,"24mo":78.31},"hba1c_series":{"baseline":62,"6mo":63,"12mo":61,"24mo":63},"egfr_series":{"baseline":88,"6mo":89,"12mo":88,"24mo":85}},{"id":38,"a":60,"r":"intermediate_unfav","g":"4+3=7","p":10.3,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":19,"h":63,"b":30.1,"e":89,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":10.3,"3mo":2.88,"6mo":0.89,"12mo":0.03,"24mo":0.04},"hba1c_series":{"baseline":63,"6mo":70,"12mo":72,"24mo":68},"egfr_series":{"baseline":89,"6mo":86,"12mo":85,"24mo":83}},{"id":39,"a":51,"r":"very_high_metastatic","g":"4+5=9","p":131.6,"t":"ADT_only","o":"deceased_cancer","d":"T2","dd":6,"h":61,"b":30.1,"e":73,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":131.6,"3mo":14.58,"6mo":3.4,"12mo":7.39,"24mo":25.11},"hba1c_series":{"baseline":61,"6mo":62,"12mo":67,"24mo":72},"egfr_series":{"baseline":73,"6mo":70,"12mo":70,"24mo":67}},{"id":40,"a":65,"r":"low","g":"3+3=6","p":5.8,"t":"RALP","o":"curative_good","d":"T2","dd":8,"h":52,"b":24.7,"e":87,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":5.8,"3mo":0.06,"6mo":0.03,"12mo":0.02,"24mo":0.04},"hba1c_series":{"baseline":52,"6mo":53,"12mo":52,"24mo":53},"egfr_series":{"baseline":87,"6mo":85,"12mo":84,"24mo":83}},{"id":41,"a":62,"r":"intermediate_fav","g":"3+4=7","p":7.2,"t":"RALP","o":"curative_good","d":"T2","dd":9,"h":58,"b":28.9,"e":67,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":7.2,"3mo":0.05,"6mo":0.04,"12mo":0.02,"24mo":0.03},"hba1c_series":{"baseline":58,"6mo":57,"12mo":57,"24mo":58},"egfr_series":{"baseline":67,"6mo":68,"12mo":65,"24mo":64}},{"id":42,"a":63,"r":"low","g":"3+3=6","p":6.6,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":13,"h":57,"b":29,"e":99,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":6.6,"3mo":0.05,"6mo":0.02,"12mo":1.09,"24mo":2.1},"hba1c_series":{"baseline":57,"6mo":58,"12mo":57,"24mo":56},"egfr_series":{"baseline":99,"6mo":98,"12mo":98,"24mo":97}},{"id":43,"a":52,"r":"intermediate_fav","g":"3+4=7","p":8.8,"t":"EBRT","o":"curative_good","d":"T2","dd":13,"h":55,"b":28.3,"e":81,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":8.8,"3mo":2.27,"6mo":1.08,"12mo":0.25,"24mo":0.25},"hba1c_series":{"baseline":55,"6mo":55,"12mo":55,"24mo":55},"egfr_series":{"baseline":81,"6mo":79,"12mo":82,"24mo":77}},{"id":44,"a":64,"r":"intermediate_fav","g":"3+4=7","p":8.9,"t":"EBRT","o":"curative_good","d":"T2","dd":20,"h":58,"b":30.5,"e":77,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":8.9,"3mo":3.12,"6mo":1.09,"12mo":0.21,"24mo":0.26},"hba1c_series":{"baseline":58,"6mo":59,"12mo":57,"24mo":60},"egfr_series":{"baseline":77,"6mo":75,"12mo":78,"24mo":72}},{"id":45,"a":59,"r":"low","g":"3+3=6","p":6,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":14,"h":66,"b":31.7,"e":49,"ht":1,"rt":0,"nf":0,"kd":1,"psa_series":{"baseline":6,"3mo":6.27,"6mo":6.36,"12mo":6.49,"24mo":6.89},"hba1c_series":{"baseline":66,"6mo":65,"12mo":66,"24mo":65},"egfr_series":{"baseline":49,"6mo":47,"12mo":48,"24mo":48}},{"id":46,"a":51,"r":"high","g":"4+4=8","p":26.2,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T1","dd":16,"h":60,"b":29.2,"e":94,"ht":0,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":26.2,"3mo":8.69,"6mo":2.02,"12mo":0.43,"24mo":3.11},"hba1c_series":{"baseline":60,"6mo":61,"12mo":64,"24mo":70},"egfr_series":{"baseline":94,"6mo":92,"12mo":90,"24mo":89}},{"id":47,"a":52,"r":"intermediate_unfav","g":"3+4=7","p":9.9,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T2","dd":9,"h":53,"b":24.2,"e":70,"ht":1,"rt":0,"nf":1,"kd":0,"psa_series":{"baseline":9.9,"3mo":2.5,"6mo":0.87,"12mo":0.69,"24mo":2.48},"hba1c_series":{"baseline":53,"6mo":54,"12mo":59,"24mo":63},"egfr_series":{"baseline":70,"6mo":68,"12mo":67,"24mo":61}},{"id":48,"a":59,"r":"intermediate_unfav","g":"3+4=7","p":8.7,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":22,"h":55,"b":31.8,"e":82,"ht":1,"rt":0,"nf":0,"kd":1,"psa_series":{"baseline":8.7,"3mo":2.74,"6mo":0.82,"12mo":0.04,"24mo":0.04},"hba1c_series":{"baseline":55,"6mo":58,"12mo":63,"24mo":61},"egfr_series":{"baseline":82,"6mo":82,"12mo":79,"24mo":78}},{"id":49,"a":52,"r":"very_low","g":"3+3=6","p":5.5,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":8,"h":63,"b":25.5,"e":63,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":5.5,"3mo":5.23,"6mo":5.78,"12mo":5.63,"24mo":6.4},"hba1c_series":{"baseline":63,"6mo":61,"12mo":63,"24mo":64},"egfr_series":{"baseline":63,"6mo":64,"12mo":61,"24mo":62}},{"id":50,"a":62,"r":"intermediate_fav","g":"3+4=7","p":7.2,"t":"EBRT","o":"curative_good","d":"T2","dd":14,"h":65,"b":26.4,"e":73,"ht":1,"rt":1,"nf":0,"kd":1,"psa_series":{"baseline":7.2,"3mo":1.95,"6mo":0.74,"12mo":0.24,"24mo":0.21},"hba1c_series":{"baseline":65,"6mo":66,"12mo":64,"24mo":66},"egfr_series":{"baseline":73,"6mo":73,"12mo":73,"24mo":69}},{"id":51,"a":57,"r":"very_high_metastatic","g":"5+4=9","p":121.5,"t":"ADT_chemo","o":"deceased_other","d":"T2","dd":10,"h":66,"b":29.1,"e":77,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":121.5,"3mo":13.06,"6mo":1.7,"12mo":0.01,"24mo":0.02},"hba1c_series":{"baseline":66,"6mo":70,"12mo":74,"24mo":79},"egfr_series":{"baseline":77,"6mo":75,"12mo":73,"24mo":73}},{"id":52,"a":59,"r":"intermediate_unfav","g":"3+4=7","p":13.1,"t":"RALP","o":"curative_side_effects","d":"T2","dd":17,"h":55,"b":31.7,"e":86,"ht":0,"rt":0,"nf":0,"kd":1,"psa_series":{"baseline":13.1,"3mo":0.05,"6mo":0.03,"12mo":0.03,"24mo":0.05},"hba1c_series":{"baseline":55,"6mo":56,"12mo":57,"24mo":55},"egfr_series":{"baseline":86,"6mo":86,"12mo":86,"24mo":82}},{"id":53,"a":56,"r":"very_low","g":"3+3=6","p":2.7,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":14,"h":70,"b":29.4,"e":69,"ht":1,"rt":0,"nf":0,"kd":1,"psa_series":{"baseline":2.7,"3mo":2.67,"6mo":2.71,"12mo":2.77,"24mo":2.94},"hba1c_series":{"baseline":70,"6mo":71,"12mo":68,"24mo":72},"egfr_series":{"baseline":69,"6mo":67,"12mo":68,"24mo":68}},{"id":54,"a":57,"r":"intermediate_unfav","g":"4+3=7","p":10.7,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":5,"h":54,"b":32.1,"e":77,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":10.7,"3mo":3.65,"6mo":0.86,"12mo":0.97,"24mo":3.79},"hba1c_series":{"baseline":54,"6mo":59,"12mo":56,"24mo":56},"egfr_series":{"baseline":77,"6mo":75,"12mo":73,"24mo":74}},{"id":55,"a":54,"r":"low","g":"3+3=6","p":3,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":10,"h":61,"b":30.7,"e":69,"ht":1,"rt":1,"nf":1,"kd":0,"psa_series":{"baseline":3,"3mo":2.87,"6mo":2.93,"12mo":3.12,"24mo":3.2},"hba1c_series":{"baseline":61,"6mo":61,"12mo":62,"24mo":60},"egfr_series":{"baseline":69,"6mo":67,"12mo":68,"24mo":65}},{"id":56,"a":60,"r":"intermediate_fav","g":"3+4=7","p":6.8,"t":"RALP","o":"curative_good","d":"T2","dd":15,"h":48,"b":29.6,"e":54,"ht":1,"rt":0,"nf":1,"kd":0,"psa_series":{"baseline":6.8,"3mo":0.05,"6mo":0.03,"12mo":0.03,"24mo":0.05},"hba1c_series":{"baseline":48,"6mo":47,"12mo":48,"24mo":49},"egfr_series":{"baseline":54,"6mo":53,"12mo":50,"24mo":48}},{"id":57,"a":53,"r":"intermediate_unfav","g":"4+3=7","p":7.2,"t":"RALP","o":"curative_side_effects","d":"T1","dd":19,"h":53,"b":20.5,"e":70,"ht":0,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":7.2,"3mo":0.05,"6mo":0.02,"12mo":0.03,"24mo":0.07},"hba1c_series":{"baseline":53,"6mo":53,"12mo":55,"24mo":55},"egfr_series":{"baseline":70,"6mo":69,"12mo":68,"24mo":68}},{"id":58,"a":62,"r":"high","g":"4+3=7","p":17.7,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":12,"h":64,"b":32.3,"e":90,"ht":1,"rt":0,"nf":0,"kd":1,"psa_series":{"baseline":17.7,"3mo":5.97,"6mo":1.26,"12mo":0.88,"24mo":5.31},"hba1c_series":{"baseline":64,"6mo":70,"12mo":68,"24mo":73},"egfr_series":{"baseline":90,"6mo":90,"12mo":89,"24mo":87}},{"id":59,"a":65,"r":"low","g":"3+3=6","p":6.5,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":18,"h":68,"b":33.2,"e":90,"ht":1,"rt":0,"nf":1,"kd":0,"psa_series":{"baseline":6.5,"3mo":0.06,"6mo":0.03,"12mo":0.97,"24mo":2.22},"hba1c_series":{"baseline":68,"6mo":67,"12mo":67,"24mo":70},"egfr_series":{"baseline":90,"6mo":88,"12mo":89,"24mo":84}},{"id":60,"a":61,"r":"intermediate_unfav","g":"3+4=7","p":8,"t":"RALP","o":"curative_side_effects","d":"T1","dd":24,"h":69,"b":24.4,"e":56,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":8,"3mo":0.05,"6mo":0.04,"12mo":0.03,"24mo":0.07},"hba1c_series":{"baseline":69,"6mo":69,"12mo":68,"24mo":72},"egfr_series":{"baseline":56,"6mo":55,"12mo":55,"24mo":55}},{"id":61,"a":61,"r":"low","g":"3+3=6","p":6.3,"t":"RALP","o":"curative_good","d":"T2","dd":23,"h":51,"b":30.3,"e":86,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":6.3,"3mo":0.04,"6mo":0.02,"12mo":0.02,"24mo":0.07},"hba1c_series":{"baseline":51,"6mo":52,"12mo":50,"24mo":50},"egfr_series":{"baseline":86,"6mo":85,"12mo":86,"24mo":81}},{"id":62,"a":59,"r":"very_low","g":"3+3=6","p":5.5,"t":"active_surveillance","o":"reclassified_to_treatment","d":"T2","dd":23,"h":51,"b":27.1,"e":75,"ht":1,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":5.5,"3mo":6.28,"6mo":7.44,"12mo":8.79,"24mo":12.17},"hba1c_series":{"baseline":51,"6mo":51,"12mo":52,"24mo":50},"egfr_series":{"baseline":75,"6mo":75,"12mo":76,"24mo":73}},{"id":63,"a":61,"r":"very_low","g":"3+3=6","p":2.7,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":14,"h":51,"b":29.9,"e":64,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":2.7,"3mo":2.83,"6mo":2.81,"12mo":2.79,"24mo":3.19},"hba1c_series":{"baseline":51,"6mo":52,"12mo":50,"24mo":50},"egfr_series":{"baseline":64,"6mo":63,"12mo":64,"24mo":64}},{"id":64,"a":53,"r":"high","g":"4+4=8","p":33.4,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T2","dd":15,"h":54,"b":31.7,"e":61,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":33.4,"3mo":10.77,"6mo":2.96,"12mo":0.68,"24mo":2.7},"hba1c_series":{"baseline":54,"6mo":53,"12mo":55,"24mo":55},"egfr_series":{"baseline":61,"6mo":58,"12mo":60,"24mo":55}},{"id":65,"a":58,"r":"high","g":"4+3=7","p":13.4,"t":"RALP_adj","o":"local_progression","d":"T2","dd":13,"h":64,"b":32.8,"e":71,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":13.4,"3mo":0.05,"6mo":0.04,"12mo":0.87,"24mo":3.36},"hba1c_series":{"baseline":64,"6mo":65,"12mo":64,"24mo":63},"egfr_series":{"baseline":71,"6mo":70,"12mo":71,"24mo":69}},{"id":66,"a":51,"r":"low","g":"3+3=6","p":6.8,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":8,"h":56,"b":27.4,"e":80,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":6.8,"3mo":6.99,"6mo":7.28,"12mo":6.87,"24mo":7.45},"hba1c_series":{"baseline":56,"6mo":55,"12mo":54,"24mo":54},"egfr_series":{"baseline":80,"6mo":78,"12mo":79,"24mo":75}},{"id":67,"a":53,"r":"high","g":"4+3=7","p":37.8,"t":"RALP_adj","o":"biochemical_recurrence","d":"T2","dd":7,"h":72,"b":23.2,"e":55,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":37.8,"3mo":0.05,"6mo":0.02,"12mo":0.95,"24mo":2.55},"hba1c_series":{"baseline":72,"6mo":70,"12mo":73,"24mo":71},"egfr_series":{"baseline":55,"6mo":53,"12mo":56,"24mo":52}},{"id":68,"a":57,"r":"intermediate_fav","g":"3+4=7","p":6.4,"t":"RALP","o":"curative_good","d":"T1","dd":31,"h":51,"b":29.9,"e":74,"ht":0,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":6.4,"3mo":0.04,"6mo":0.02,"12mo":0.03,"24mo":0.03},"hba1c_series":{"baseline":51,"6mo":50,"12mo":51,"24mo":50},"egfr_series":{"baseline":74,"6mo":73,"12mo":73,"24mo":71}},{"id":69,"a":62,"r":"very_high_metastatic","g":"4+5=9","p":159.3,"t":"palliative","o":"deceased_cancer","d":"T2","dd":10,"h":76,"b":31.6,"e":85,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":159.3,"3mo":102.83,"6mo":68.84,"12mo":73.59,"24mo":123.44},"hba1c_series":{"baseline":76,"6mo":77,"12mo":75,"24mo":76},"egfr_series":{"baseline":85,"6mo":84,"12mo":85,"24mo":83}},{"id":70,"a":56,"r":"low","g":"3+3=6","p":7.5,"t":"RALP","o":"biochemical_recurrence","d":"T2","dd":21,"h":71,"b":33.6,"e":52,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":7.5,"3mo":0.03,"6mo":0.03,"12mo":1.05,"24mo":2.3},"hba1c_series":{"baseline":71,"6mo":72,"12mo":71,"24mo":71},"egfr_series":{"baseline":52,"6mo":51,"12mo":49,"24mo":50}},{"id":71,"a":52,"r":"very_low","g":"3+3=6","p":3.6,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":5,"h":50,"b":30.9,"e":42,"ht":0,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":3.6,"3mo":3.43,"6mo":3.77,"12mo":3.8,"24mo":3.87},"hba1c_series":{"baseline":50,"6mo":49,"12mo":50,"24mo":48},"egfr_series":{"baseline":42,"6mo":42,"12mo":39,"24mo":39}},{"id":72,"a":55,"r":"very_high_metastatic","g":"4+5=9","p":192.6,"t":"EBRT_ADT","o":"deceased_cancer","d":"T1","dd":31,"h":53,"b":20,"e":76,"ht":1,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":192.6,"3mo":50.01,"6mo":19.17,"12mo":3.04,"24mo":13.02},"hba1c_series":{"baseline":53,"6mo":56,"12mo":55,"24mo":56},"egfr_series":{"baseline":76,"6mo":75,"12mo":73,"24mo":71}},{"id":73,"a":52,"r":"intermediate_unfav","g":"4+3=7","p":7.6,"t":"EBRT_ADT","o":"curative_good","d":"T1","dd":32,"h":56,"b":31.2,"e":76,"ht":1,"rt":1,"nf":1,"kd":0,"psa_series":{"baseline":7.6,"3mo":2.57,"6mo":0.63,"12mo":0.04,"24mo":0.03},"hba1c_series":{"baseline":56,"6mo":55,"12mo":60,"24mo":63},"egfr_series":{"baseline":76,"6mo":75,"12mo":74,"24mo":67}},{"id":74,"a":55,"r":"very_high_metastatic","g":"4+4=8","p":166,"t":"palliative","o":"deceased_other","d":"T1","dd":24,"h":53,"b":23.1,"e":74,"ht":1,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":166,"3mo":123.51,"6mo":79.54,"12mo":58.95,"24mo":39.43},"hba1c_series":{"baseline":53,"6mo":53,"12mo":53,"24mo":54},"egfr_series":{"baseline":74,"6mo":75,"12mo":71,"24mo":73}},{"id":75,"a":50,"r":"intermediate_unfav","g":"3+4=7","p":10.6,"t":"EBRT_ADT","o":"local_progression","d":"T2","dd":8,"h":51,"b":27.9,"e":73,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":10.6,"3mo":2.94,"6mo":0.97,"12mo":1.31,"24mo":5.11},"hba1c_series":{"baseline":51,"6mo":52,"12mo":58,"24mo":59},"egfr_series":{"baseline":73,"6mo":73,"12mo":70,"24mo":66}},{"id":76,"a":53,"r":"very_high_metastatic","g":"5+4=9","p":94.4,"t":"ADT_chemo","o":"deceased_cancer","d":"T2","dd":3,"h":62,"b":25.4,"e":66,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":94.4,"3mo":6.85,"6mo":1.55,"12mo":5.84,"24mo":20.29},"hba1c_series":{"baseline":62,"6mo":62,"12mo":69,"24mo":69},"egfr_series":{"baseline":66,"6mo":65,"12mo":63,"24mo":59}},{"id":77,"a":60,"r":"intermediate_fav","g":"3+4=7","p":11.5,"t":"RALP","o":"curative_good","d":"T2","dd":5,"h":64,"b":30,"e":77,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":11.5,"3mo":0.02,"6mo":0.03,"12mo":0.03,"24mo":0.04},"hba1c_series":{"baseline":64,"6mo":66,"12mo":63,"24mo":66},"egfr_series":{"baseline":77,"6mo":76,"12mo":75,"24mo":77}},{"id":78,"a":56,"r":"high","g":"4+4=8","p":29,"t":"RALP_adj","o":"curative_side_effects","d":"T2","dd":21,"h":56,"b":30.5,"e":64,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":29,"3mo":0.02,"6mo":0.04,"12mo":0.04,"24mo":0.03},"hba1c_series":{"baseline":56,"6mo":57,"12mo":56,"24mo":55},"egfr_series":{"baseline":64,"6mo":63,"12mo":63,"24mo":60}},{"id":79,"a":56,"r":"high","g":"4+4=8","p":11,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":14,"h":65,"b":27.6,"e":74,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":11,"3mo":3.81,"6mo":0.98,"12mo":0.03,"24mo":0.04},"hba1c_series":{"baseline":65,"6mo":73,"12mo":69,"24mo":75},"egfr_series":{"baseline":74,"6mo":74,"12mo":70,"24mo":71}},{"id":80,"a":58,"r":"high","g":"4+4=8","p":13,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":19,"h":71,"b":31,"e":58,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":13,"3mo":3.3,"6mo":1.09,"12mo":0.02,"24mo":0.02},"hba1c_series":{"baseline":71,"6mo":77,"12mo":82,"24mo":76},"egfr_series":{"baseline":58,"6mo":58,"12mo":55,"24mo":54}},{"id":81,"a":59,"r":"intermediate_unfav","g":"4+3=7","p":8,"t":"EBRT_ADT","o":"curative_good","d":"T2","dd":19,"h":45,"b":24.7,"e":80,"ht":1,"rt":1,"nf":1,"kd":0,"psa_series":{"baseline":8,"3mo":2.08,"6mo":0.67,"12mo":0.02,"24mo":0.03},"hba1c_series":{"baseline":45,"6mo":44,"12mo":47,"24mo":56},"egfr_series":{"baseline":80,"6mo":77,"12mo":78,"24mo":74}},{"id":82,"a":51,"r":"intermediate_fav","g":"3+4=7","p":8.7,"t":"RALP","o":"curative_side_effects","d":"T2","dd":9,"h":54,"b":30,"e":77,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":8.7,"3mo":0.02,"6mo":0.02,"12mo":0.03,"24mo":0.03},"hba1c_series":{"baseline":54,"6mo":54,"12mo":55,"24mo":53},"egfr_series":{"baseline":77,"6mo":75,"12mo":76,"24mo":72}},{"id":83,"a":52,"r":"intermediate_fav","g":"3+4=7","p":6.9,"t":"RALP","o":"curative_side_effects","d":"T2","dd":9,"h":56,"b":34.8,"e":97,"ht":0,"rt":0,"nf":1,"kd":0,"psa_series":{"baseline":6.9,"3mo":0.03,"6mo":0.03,"12mo":0.02,"24mo":0.04},"hba1c_series":{"baseline":56,"6mo":56,"12mo":56,"24mo":54},"egfr_series":{"baseline":97,"6mo":96,"12mo":93,"24mo":90}},{"id":84,"a":58,"r":"very_high_metastatic","g":"4+4=8","p":125.2,"t":"ADT_chemo","o":"partial_response","d":"T2","dd":16,"h":68,"b":29.3,"e":64,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":125.2,"3mo":9.05,"6mo":1.88,"12mo":0.01,"24mo":0.03},"hba1c_series":{"baseline":68,"6mo":69,"12mo":78,"24mo":77},"egfr_series":{"baseline":64,"6mo":63,"12mo":61,"24mo":60}},{"id":85,"a":65,"r":"very_high_metastatic","g":"5+4=9","p":159.7,"t":"ADT_chemo","o":"partial_response","d":"T2","dd":5,"h":54,"b":27.8,"e":82,"ht":1,"rt":0,"nf":1,"kd":0,"psa_series":{"baseline":159.7,"3mo":15.05,"6mo":2.08,"12mo":0.01,"24mo":0.01},"hba1c_series":{"baseline":54,"6mo":53,"12mo":60,"24mo":65},"egfr_series":{"baseline":82,"6mo":79,"12mo":77,"24mo":72}},{"id":86,"a":52,"r":"very_low","g":"3+3=6","p":3.2,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":16,"h":54,"b":31.5,"e":93,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":3.2,"3mo":3.08,"6mo":3.13,"12mo":3.27,"24mo":3.24},"hba1c_series":{"baseline":54,"6mo":53,"12mo":53,"24mo":54},"egfr_series":{"baseline":93,"6mo":92,"12mo":92,"24mo":88}},{"id":87,"a":55,"r":"intermediate_unfav","g":"3+4=7","p":10.3,"t":"RALP","o":"curative_side_effects","d":"T2","dd":4,"h":57,"b":31.5,"e":70,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":10.3,"3mo":0.05,"6mo":0.03,"12mo":0.02,"24mo":0.04},"hba1c_series":{"baseline":57,"6mo":56,"12mo":57,"24mo":54},"egfr_series":{"baseline":70,"6mo":69,"12mo":70,"24mo":68}},{"id":88,"a":56,"r":"high","g":"4+3=7","p":30.9,"t":"EBRT_ADT","o":"curative_side_effects","d":"T2","dd":6,"h":61,"b":32.9,"e":82,"ht":1,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":30.9,"3mo":10.18,"6mo":3.96,"12mo":0.03,"24mo":0.03},"hba1c_series":{"baseline":61,"6mo":65,"12mo":62,"24mo":67},"egfr_series":{"baseline":82,"6mo":81,"12mo":80,"24mo":76}},{"id":89,"a":57,"r":"low","g":"3+3=6","p":4.7,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":9,"h":50,"b":36.1,"e":81,"ht":0,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":4.7,"3mo":4.64,"6mo":4.91,"12mo":4.95,"24mo":5.32},"hba1c_series":{"baseline":50,"6mo":49,"12mo":50,"24mo":51},"egfr_series":{"baseline":81,"6mo":82,"12mo":81,"24mo":77}},{"id":90,"a":51,"r":"high","g":"4+3=7","p":25,"t":"EBRT_ADT","o":"biochemical_recurrence","d":"T2","dd":12,"h":72,"b":27.5,"e":91,"ht":1,"rt":1,"nf":0,"kd":0,"psa_series":{"baseline":25,"3mo":6.92,"6mo":2.67,"12mo":0.38,"24mo":2.12},"hba1c_series":{"baseline":72,"6mo":78,"12mo":77,"24mo":78},"egfr_series":{"baseline":91,"6mo":89,"12mo":89,"24mo":84}},{"id":91,"a":60,"r":"very_high_metastatic","g":"5+4=9","p":157.8,"t":"palliative","o":"deceased_cancer","d":"T2","dd":23,"h":58,"b":26.4,"e":79,"ht":1,"rt":0,"nf":1,"kd":1,"psa_series":{"baseline":157.8,"3mo":93.68,"6mo":87.6,"12mo":67.92,"24mo":120.87},"hba1c_series":{"baseline":58,"6mo":58,"12mo":58,"24mo":60},"egfr_series":{"baseline":79,"6mo":76,"12mo":76,"24mo":74}},{"id":92,"a":52,"r":"low","g":"3+3=6","p":5.5,"t":"RALP","o":"curative_good","d":"T2","dd":2,"h":76,"b":33.6,"e":79,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":5.5,"3mo":0.03,"6mo":0.04,"12mo":0.04,"24mo":0.03},"hba1c_series":{"baseline":76,"6mo":78,"12mo":77,"24mo":75},"egfr_series":{"baseline":79,"6mo":79,"12mo":76,"24mo":74}},{"id":93,"a":59,"r":"low","g":"3+3=6","p":3.5,"t":"active_surveillance","o":"reclassified_to_treatment","d":"T2","dd":15,"h":57,"b":29.3,"e":73,"ht":1,"rt":0,"nf":0,"kd":1,"psa_series":{"baseline":3.5,"3mo":4.02,"6mo":4.71,"12mo":5.05,"24mo":7.98},"hba1c_series":{"baseline":57,"6mo":58,"12mo":57,"24mo":57},"egfr_series":{"baseline":73,"6mo":73,"12mo":72,"24mo":71}},{"id":94,"a":50,"r":"intermediate_fav","g":"3+4=7","p":5.6,"t":"RALP","o":"curative_side_effects","d":"T2","dd":8,"h":57,"b":30.4,"e":67,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":5.6,"3mo":0.06,"6mo":0.04,"12mo":0.03,"24mo":0.03},"hba1c_series":{"baseline":57,"6mo":59,"12mo":56,"24mo":57},"egfr_series":{"baseline":67,"6mo":66,"12mo":64,"24mo":66}},{"id":95,"a":52,"r":"intermediate_fav","g":"3+4=7","p":9.3,"t":"RALP","o":"curative_good","d":"T2","dd":14,"h":57,"b":27.7,"e":72,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":9.3,"3mo":0.03,"6mo":0.03,"12mo":0.02,"24mo":0.04},"hba1c_series":{"baseline":57,"6mo":56,"12mo":56,"24mo":59},"egfr_series":{"baseline":72,"6mo":70,"12mo":70,"24mo":68}},{"id":96,"a":60,"r":"intermediate_fav","g":"3+4=7","p":10.8,"t":"EBRT","o":"curative_side_effects","d":"T2","dd":24,"h":61,"b":32.1,"e":58,"ht":1,"rt":0,"nf":1,"kd":1,"psa_series":{"baseline":10.8,"3mo":2.88,"6mo":0.89,"12mo":0.19,"24mo":0.23},"hba1c_series":{"baseline":61,"6mo":62,"12mo":59,"24mo":60},"egfr_series":{"baseline":58,"6mo":56,"12mo":54,"24mo":51}},{"id":97,"a":54,"r":"very_high_metastatic","g":"5+4=9","p":69.1,"t":"ADT_only","o":"partial_response","d":"T2","dd":3,"h":57,"b":32.5,"e":75,"ht":1,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":69.1,"3mo":6.31,"6mo":1.74,"12mo":0.01,"24mo":0.02},"hba1c_series":{"baseline":57,"6mo":63,"12mo":59,"24mo":64},"egfr_series":{"baseline":75,"6mo":73,"12mo":73,"24mo":70}},{"id":98,"a":51,"r":"very_low","g":"3+3=6","p":4.9,"t":"active_surveillance","o":"stable_AS","d":"T2","dd":2,"h":65,"b":28,"e":92,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":4.9,"3mo":4.86,"6mo":5.18,"12mo":5.24,"24mo":5.55},"hba1c_series":{"baseline":65,"6mo":65,"12mo":64,"24mo":66},"egfr_series":{"baseline":92,"6mo":93,"12mo":91,"24mo":88}},{"id":99,"a":64,"r":"low","g":"3+3=6","p":4,"t":"RALP","o":"curative_good","d":"T2","dd":22,"h":51,"b":27.4,"e":78,"ht":1,"rt":1,"nf":0,"kd":1,"psa_series":{"baseline":4,"3mo":0.06,"6mo":0.03,"12mo":0.02,"24mo":0.05},"hba1c_series":{"baseline":51,"6mo":50,"12mo":50,"24mo":50},"egfr_series":{"baseline":78,"6mo":77,"12mo":76,"24mo":73}},{"id":100,"a":54,"r":"high","g":"4+4=8","p":18.7,"t":"RALP_adj","o":"biochemical_recurrence","d":"T2","dd":2,"h":54,"b":32,"e":51,"ht":0,"rt":0,"nf":0,"kd":0,"psa_series":{"baseline":18.7,"3mo":0.03,"6mo":0.02,"12mo":1.03,"24mo":1.92},"hba1c_series":{"baseline":54,"6mo":55,"12mo":53,"24mo":55},"egfr_series":{"baseline":51,"6mo":50,"12mo":50,"24mo":46}}];

var FIELD_LABELS = {
  a: "Ålder (år)", r: "Riskgrupp", g: "Gleason", p: "PSA vid diagnos (ng/mL)",
  t: "Behandling", o: "Utfall", d: "Diabetestyp", dd: "Diabetesduration (år)",
  h: "HbA1c baseline (mmol/mol)", b: "BMI", e: "eGFR baseline (mL/min/1.73m²)",
  ht: "Hypertoni (0/1)", rt: "Retinopati (0/1)", nf: "Nefropati (0/1)", kd: "Kardiovaskulär sjukdom (0/1)",
  psa_series: "PSA-tidsserie (baseline, 3mo, 6mo, 12mo, 24mo)",
  hba1c_series: "HbA1c-tidsserie (baseline, 6mo, 12mo, 24mo)",
  egfr_series: "eGFR-tidsserie (baseline, 6mo, 12mo, 24mo)"
};

var CATEGORICAL = ["r","g","t","o","d"];
var NUMERIC = ["a","p","dd","h","b","e"];
var BINARY = ["ht","rt","nf","kd"];
var TIME_SERIES = ["psa_series", "hba1c_series", "egfr_series"];

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

// ========== TIME SERIES QUERIES ==========

function getTimeSeries(measure, groupBy, filters) {
  var seriesField;
  if (measure === "psa") seriesField = "psa_series";
  else if (measure === "hba1c") seriesField = "hba1c_series";
  else if (measure === "egfr") seriesField = "egfr_series";
  else return { error: "Unknown measure: " + measure + ". Use 'psa', 'hba1c', or 'egfr'." };

  var data = applyFilters(PATIENTS, filters);
  if (data.length === 0) return { measure: measure, n: 0, error: "No patients match filters" };

  // Get all timepoints from first patient
  var sample = data[0][seriesField];
  if (!sample) return { error: "No time series data for " + measure };
  var timepoints = Object.keys(sample);

  if (!groupBy) {
    // Aggregate mean across all matching patients per timepoint
    var means = {};
    var counts = {};
    timepoints.forEach(function(tp) {
      var vals = data.map(function(p) { return p[seriesField][tp]; }).filter(function(v) { return v !== undefined && v !== null; });
      var sum = vals.reduce(function(s,v){return s+v;},0);
      means[tp] = Math.round(sum / vals.length * 100) / 100;
      counts[tp] = vals.length;
    });
    return { measure: measure, series_field: seriesField, n: data.length, timepoints: timepoints, mean_values: means, patient_counts: counts };
  }

  // Grouped by a field (e.g. treatment)
  var groups = {};
  data.forEach(function(p) {
    var g = String(p[groupBy]);
    if (!groups[g]) groups[g] = [];
    groups[g].push(p);
  });

  var grouped = {};
  Object.keys(groups).forEach(function(g) {
    var pts = groups[g];
    var means = {};
    timepoints.forEach(function(tp) {
      var vals = pts.map(function(p) { return p[seriesField][tp]; }).filter(function(v) { return v !== undefined && v !== null; });
      var sum = vals.reduce(function(s,v){return s+v;},0);
      means[tp] = Math.round(sum / vals.length * 100) / 100;
    });
    grouped[g] = { n: pts.length, mean_values: means };
  });

  return { measure: measure, series_field: seriesField, group_by: groupBy, group_label: FIELD_LABELS[groupBy] || groupBy, n: data.length, timepoints: timepoints, groups: grouped };
}

function getPatientTimeSeries(patientIds, measures) {
  var results = [];
  var measList = measures || ["psa", "hba1c", "egfr"];
  var fieldMap = { psa: "psa_series", hba1c: "hba1c_series", egfr: "egfr_series" };

  patientIds.forEach(function(id) {
    var p = PATIENTS.find(function(pt) { return pt.id === id; });
    if (!p) return;
    var entry = { id: p.id, age: p.a, treatment: p.t, outcome: p.o, diabetes: p.d };
    measList.forEach(function(m) {
      var f = fieldMap[m];
      if (f && p[f]) entry[m] = p[f];
    });
    results.push(entry);
  });
  return { patients: results, measures: measList };
}

// Export for use in cohort-chat.js
export {
  PATIENTS,
  FIELD_LABELS,
  CATEGORICAL,
  NUMERIC,
  BINARY,
  TIME_SERIES,
  searchPatients,
  getStatistics,
  countPatients,
  crossTabulate,
  getTimeSeries,
  getPatientTimeSeries
};
