var responseBuffer = [];
var contentLength = 0;
var NGINX_PLUS_CONTEXT = "nginxplus";
var numSubrequests;
var rss = 0
var private_mem = 0;

var ProcessMetrics = {
    "respawned": {
        "help": "Total number of abnormally terminated and respawned child processes",
        "type": "counter"
    }
};

var WorkerConnectionsMetrics = [
    "accepted",
    "dropped",
    "active",
    "idle"
];

var WorkerHttp = [];

var WorkerHttpRequestsMetrics = [
    "total",
    "current"
];

var SslServerZoneEventsMetrics = [
    "handshakes",
    "session_reuses",
    "handshakes_failed",
    "no_common_protocol",
    "no_common_cipher",
    "handshake_timeout",
    "peer_rejected_cert"
];

var SslPeerEventsMetrics = [
    "handshakes",
    "session_reuses",
    "handshakes_failed",
    "no_common_protocol",
    "handshake_timeout",
    "peer_rejected_cert"
];

var SslServerZoneVerifyFailuresMetrics = [
   "expired_cert",
   "revoked_cert",
   "no_cert",
   "other"
];

var SslPeerVerifyFailuresMetrics = [
   "expired_cert",
   "revoked_cert",
   "hostname_mismatch",
   "other"
];

var ResponseMetrics = [
    "1xx",
    "2xx",
    "3xx",
    "4xx",
    "5xx"
];

var ResponseCodesMetrics = [
    "100",
    "101",
    "102",
    "103",
    "200",
    "201",
    "202",
    "203",
    "204",
    "205",
    "206",
    "207",
    "208",
    "218",
    "226",
    "300",
    "301",
    "302",
    "303",
    "304",
    "305",
    "307",
    "308",
    "400",
    "401",
    "402",
    "403",
    "404",
    "405",
    "406",
    "407",
    "408",
    "409",
    "410",
    "411",
    "412",
    "413",
    "414",
    "415",
    "416",
    "417",
    "419",
    "420",
    "421",
    "422",
    "423",
    "424",
    "425",
    "426",
    "428",
    "429",
    "430",
    "431",
    "440",
    "444",
    "449",
    "450",
    "451",
    "460",
    "463",
    "494",
    "495",
    "496",
    "497",
    "498",
    "499",
    "500",
    "501",
    "502",
    "503",
    "504",
    "505",
    "506",
    "507",
    "508",
    "509",
    "510",
    "511",
    "520",
    "521",
    "522",
    "523",
    "524",
    "525",
    "526",
    "527",
    "529",
    "530",
    "561",
    "598",
];

var SessionMetrics = [
    "2xx",
    "4xx",
    "5xx"
];

var NGINXStatusMetrics = {
    "config_generation": {
        "help": "The total number of configuration reloads",
        "type": "counter"
    },
    "config_uptime": {
        "help": "Time since the last reload of configuration in seconds",
        "type": "counter"
    }
};

var HealthCheckMetrics = {
    "checks": {
        "help": "Total health check requests",
        "type": "counter"
    },
    "fails": {
        "help": "Failed health checks",
        "type": "counter"
    },
    "unhealthy": {
        "help": "How many times the server became unhealthy (state 'unhealthy')",
        "type": "counter"
    }
};

var LimitConnsMetrics = {
    "passed": {
        "help": "The total number of connections that were neither limited nor accounted as limited",
        "type": "counter"
    },
    "rejected": {
        "help": "The total number of connections that were rejected",
        "type": "counter"
    },
    "rejected_dry_run": {
        "help": "The total number of connections accounted as rejected in the 'dry run' mode",
        "type": "counter"
    }
};

var LimitReqsMetrics = {
    "passed": {
        "help": "The total number of requests that were neither limited nor accounted as limited",
        "type": "counter"
    },
    "delayed": {
        "help": "The total number of requests that were delayed",
        "type": "counter"
    },
    "rejected": {
        "help": "The total number of requests that were rejected",
        "type": "counter"
    },
    "delayed_dry_run": {
        "help": "The total number of requests accounted as delayed in the 'dry run' mode",
        "type": "counter"
    },
    "rejected_dry_run": {
        "help": "The total number of requests accounted as rejected in the 'dry run' mode",
        "type": "counter"
    }
};

var UpstreamServerMetrics = {

    "active": {
        "help": "Active client connections",
        "type": "gauge"
    },

    "fails": {
        "help": "Total number of unsuccessful attempts to communicate with the server",
        "type": "counter"
    },

    "header_time": {
        "help": "Average time to get the response header from the server",
        "type": "gauge"
    },

    "health_checks": {
        "handler": prepend_metric_handler,
        "metrics": HealthCheckMetrics
    },
    "received": {
        "help": "Bytes received from clients",
        "type": "counter"
    },
    "requests": {
        "help": "Total client requests",
        "type": "counter"
    },
    "response_time": {
        "help": "Average time to get the full response from the server",
        "type": "gauge"
    },
    "responses": {
        "help": "The total number of responses obtained from this server",
        "type": "counter",
        "handler": labeled_metric_handler,
        "nested_handler": nested_metric_handler,
        "metrics": ResponseMetrics,
        "label": "code",
        "codes": {
            "help": "The number of responses per each status code",
            "type": "counter",
            "handler": labeled_metric_handler,
            "metrics": ResponseCodesMetrics,
            "label": "code"
        }
    },
    "sent": {
        "help": "Bytes sent to clients",
        "type": "counter"
    },
    "state": {
        "help": "Current state",
        "type": "gauge",
        "printFilter": convert_state
    },
    "unavail": {
        "help": "How many times the server became unavailable for client requests (state 'unavail') due to the number of unsuccessful attempts reaching the max_fails threshold",
        "type": "counter"
    },
    "ssl": {
        "help": "SSL events",
        "type": "counter",
        "handler": labeled_metric_handler,
        "nested_handler": nested_metric_handler,
        "metrics": SslPeerEventsMetrics,
        "label": "event",
        "verify_failures": {
            "help": "SSL certificate verification errors",
            "type": "counter",
            "handler": labeled_metric_handler,
            "metrics": SslPeerVerifyFailuresMetrics,
            "label": "verify_failure"
        }
    }
};

var UpstreamMetrics = {

    "keepalive": {
        "help": "Idle keepalive connections",
        "type": "gauge"
    },
    "peers": {
        "handler": upstream_server_handler,
        "metrics": UpstreamServerMetrics,
        "context": "upstream_server",
        "specifierContext": "server"
    },
    "zombies": {
        "help": "Servers removed from the group but still processing active client requests",
        "type": "gauge"
    }
};

var ServerZoneMetrics = {
    "discarded": {
        "help": "Requests completed without sending a response",
        "type": "counter"
    },
    "processing": {
        "help": "Client requests that are currently being processed",
        "type": "gauge"
    },
    "received": {
        "help": "Bytes received from clients",
        "type": "counter"
    },
    "requests": {
        "help": "Total client requests",
        "type": "counter"
    },
    "responses": {
        "help": "Total responses sent to clients",
        "type": "counter",
        "handler": labeled_metric_handler,
        "nested_handler": nested_metric_handler,
        "metrics": ResponseMetrics,
        "label": "code",
        "codes": {
            "help": "The number of responses per each status code",
            "type": "counter",
            "handler": labeled_metric_handler,
            "metrics": ResponseCodesMetrics,
            "label": "code"
        }
    },
    "sent": {
        "help": "Bytes sent to clients",
        "type": "counter"
    },
    "ssl": {
        "help": "SSL events",
        "type": "counter",
        "handler": labeled_metric_handler,
        "nested_handler": nested_metric_handler,
        "metrics": SslServerZoneEventsMetrics,
        "label": "event",
        "verify_failures": {
            "help": "SSL certificate verification errors",
            "type": "counter",
            "handler": labeled_metric_handler,
            "metrics": SslServerZoneVerifyFailuresMetrics,
            "label": "verify_failure"
        }
    }
};

var LocationZoneMetrics = {
    "discarded": {
        "help": "Requests completed without sending a response",
        "type": "counter"
    },
    "received": {
        "help": "Bytes received from clients",
        "type": "counter"
    },
    "requests": {
        "help": "Total client requests",
        "type": "counter"
    },
    "responses": {
        "help": "Total responses sent to clients",
        "type": "counter",
        "handler": labeled_metric_handler,
        "nested_handler": nested_metric_handler,
        "metrics": ResponseMetrics,
        "label": "code",
        "codes": {
            "help": "The number of responses per each status code",
            "type": "counter",
            "handler": labeled_metric_handler,
            "metrics": ResponseCodesMetrics,
            "label": "code"
        }
    },
    "sent": {
        "help": "Bytes sent to clients",
        "type": "counter"
    }
};

var ResolverRequestMetrics = [
    "name",
    "srv",
    "addr"
];

var ResolverResponseMetrics = [
    "noerror",
    "formerr",
    "servfail",
    "nxdomain",
    "notimp",
    "refused",
    "timedout",
    "unknown"
];

var ResolverMetrics = {
    "requests": {
        "help": "Request types sent to resolver",
        "type": "counter",
        "handler": labeled_metric_handler,
        "metrics": ResolverRequestMetrics,
        "label": "type"
    },
    "responses": {
        "help": "Response types sent to clients",
        "type": "counter",
        "handler": labeled_metric_handler,
        "metrics": ResolverResponseMetrics,
        "label": "type"
    }
};

var StreamUpstreamServerMetrics = {
    "active": {
        "help": "Active client connections",
        "type": "gauge"
    },
    "connect_time": {
        "help": "Average time to connect to the upstream server",
        "type": "gauge"
    },
    "connections": {
        "help": "Total number of client connections forwarded to this server",
        "type": "counter"
    },
    "fails": {
        "help": "Total number of unsuccessful attempts to communicate with the server",
        "type": "counter"
    },
    "first_byte_time": {
        "help": "Average time to receive the first byte of data",
        "type": "gauge"
    },
    "health_checks": {
        "handler": prepend_metric_handler,
        "metrics": HealthCheckMetrics
    },
    "received": {
        "help": "Bytes received from clients",
        "type": "counter"
    },
    "response_time": {
        "help": "Average time to receive the last byte of data",
        "type": "gauge"
    },
    "sent": {
        "help": "Bytes sent to clients",
        "type": "counter"
    },
    "state": {
        "help": "Current state",
        "type": "gauge",
        "printFilter": convert_state
    },
    "unavail": {
        "help": "How many times the server became unavailable for client requests (state 'unavail') due to the number of unsuccessful attempts reaching the max_fails threshold",
        "type": "counter"
    },
    "ssl": {
        "help": "SSL events",
        "type": "counter",
        "handler": labeled_metric_handler,
        "nested_handler": nested_metric_handler,
        "metrics": SslPeerEventsMetrics,
        "label": "event",
        "verify_failures": {
            "help": "SSL certificate verification errors",
            "type": "counter",
            "handler": labeled_metric_handler,
            "metrics": SslPeerVerifyFailuresMetrics,
            "label": "verify_failure"
        }
    }
};

var StreamUpstreamMetrics = {
    "zombies": {
        "help": "Servers removed from the group but still processing active client requests",
        "type": "gauge"
    },
    "peers": {
        "handler": upstream_server_handler,
        "metrics": StreamUpstreamServerMetrics,
        "context": "stream_upstream_server",
        "specifierContext": "server"
    }
};

var StreamServerZoneMetrics = {
    "connections": {
        "help": "Total connections",
        "type": "counter"
    },
    "discarded": {
        "help": "Connections completed without creating a session",
        "type": "counter"
    },
    "processing": {
        "help": "Client connections that are currently being processed",
        "type": "gauge"
    },
    "received": {
        "help": "Bytes received from clients",
        "type": "counter"
    },
    "sent": {
        "help": "Bytes sent to clients",
        "type": "counter"
    },
    "sessions": {
        "help": "Total sessions completed",
        "type": "counter",
        "handler": labeled_metric_handler,
        "metrics": SessionMetrics,
        "label": "code"
    },
    "ssl": {
        "help": "SSL events",
        "type": "counter",
        "handler": labeled_metric_handler,
        "nested_handler": nested_metric_handler,
        "metrics": SslServerZoneEventsMetrics,
        "label": "event",
        "verify_failures": {
            "help": "SSL certificate verification errors",
            "type": "counter",
            "handler": labeled_metric_handler,
            "metrics": SslServerZoneVerifyFailuresMetrics,
            "label": "verify_failure"
        }
    }
};

var WorkerMetrics = {
    "pid" : {
        "help": "Worker PID",
        "type": "gauge"
    },
    "connections": {
        "help": "Client connections handled by worker",
        "type": "gauge",
        "handler": labeled_metric_handler,
        "metrics": WorkerConnectionsMetrics,
        "label": "connections"
    },
    "http": {
        "nested_handler": nested_metric_handler,
        "handler": labeled_metric_handler,
        "metrics" : WorkerHttp,
        "label": "http",
        "requests": {
            "help": "HTTP requests handled by worker",
            "type": "gauge",
            "handler": labeled_metric_handler,
            "metrics": WorkerHttpRequestsMetrics,
            "label": "requests"
        }
    }
};

var ConnectionMetrics = {
    "accepted": {
        "help": "Accepted client connections",
        "type": "counter"
    },
    "active": {
        "help": "Active client connections",
        "type": "gauge"
    },
    "dropped": {
        "help": "Dropped client connections",
        "type": "counter"
    },
    "idle": {
        "help": "Idle client connections",
        "type": "gauge"
    }
};

var HttpRequestMetrics = {
    "total": {
        "help": "Total http requests",
        "type": "counter"
    },
    "current": {
        "help": "Current http requests",
        "type": "gauge"
    }
};

var HttpCacheHitMetrics = {
    "responses": {
        "help": "Total number of valid responses read from the cache",
        "type": "counter"
    },
    "bytes": {
        "help": "Total number of bytes read from the cache",
        "type": "counter"
    }
};

var HttpCacheStaleMetrics = {
    "responses": {
        "help": "Total number of expired responses read from the cache",
        "type": "counter"
    },
    "bytes": {
        "help": "Total number of bytes read from the cache",
        "type": "counter"
    }
};

var HttpCacheUpdatingMetrics = {
    "responses": {
        "help": "Total number of expired responses read from the cache while responses were being updated",
        "type": "counter"
    },
    "bytes": {
        "help": "Total number of bytes read from the cache",
        "type": "counter"
    }
};

var HttpCacheRevalidatedMetrics = {
    "responses": {
        "help": "Total number of expired and revalidated responses read from the cache",
        "type": "counter"
    },
    "bytes": {
        "help": "Total number of bytes read from the cache",
        "type": "counter"
    }
};

var HttpCacheMissMetrics = {
    "responses": {
        "help": "Total number of responses not found in the cache",
        "type": "counter"
    },
    "bytes": {
        "help": "Total number of bytes read from the proxied server",
        "type": "counter"
    },
    "responses_written": {
        "help": "Total number of responses written to the cache",
        "type": "counter"
    },
    "bytes_written": {
        "help": "Total number of bytes written to the cache",
        "type": "counter"
    }
};

var HttpCacheExpiredMetrics = {
    "responses": {
        "help": "Total number of expired responses not taken from the cache",
        "type": "counter"
    },
    "bytes": {
        "help": "Total number of bytes read from the proxied server",
        "type": "counter"
    },
    "responses_written": {
        "help": "Total number of responses written to the cache",
        "type": "counter"
    },
    "bytes_written": {
        "help": "Total number of bytes written to the cache",
        "type": "counter"
    }
};

var HttpCacheBypassMetrics = {
    "responses": {
        "help": "Total number of responses not looked up in the cache",
        "type": "counter"
    },
    "bytes": {
        "help": "Total number of bytes read from the proxied server",
        "type": "counter"
    },
    "responses_written": {
        "help": "Total number of responses written to the cache",
        "type": "counter"
    },
    "bytes_written": {
        "help": "Total number of bytes written to the cache",
        "type": "counter"
    }
};

var HttpCacheMetrics = {
    "size": {
        "help": "Current size of the cache",
        "type": "gauge"
    },
    "max_size": {
        "help": "Limit on the maximum size of the cache",
        "type": "gauge"
    },
    "cold": {
        "help": "Indicates whether the “cache loader” process is still loading data from disk into the cache",
        "type": "gauge",
        "printFilter": convert_state
    },
    "hit": {
        "handler": prepend_metric_handler,
        "metrics": HttpCacheHitMetrics
    },
    "stale": {
        "handler": prepend_metric_handler,
        "metrics": HttpCacheStaleMetrics
    },
    "updating": {
        "handler": prepend_metric_handler,
        "metrics": HttpCacheUpdatingMetrics
    },
    "revalidated": {
        "handler": prepend_metric_handler,
        "metrics": HttpCacheRevalidatedMetrics
    },
    "miss": {
      "handler": prepend_metric_handler,
      "metrics": HttpCacheMissMetrics
    },
    "expired": {
      "handler": prepend_metric_handler,
      "metrics": HttpCacheExpiredMetrics
    },
    "bypass": {
      "handler": prepend_metric_handler,
      "metrics": HttpCacheBypassMetrics
    }
};

var SslMetrics = {
    "handshakes": {
        "help": "Successful SSL handshakes",
        "type": "counter"
    },
    "handshakes_failed": {
        "help": "Failed SSL handshakes",
        "type": "counter"
    },
    "session_reuses": {
        "help": "Session reuses during SSL handshake",
        "type": "counter"
    },
    "no_common_protocol": {
        "help": "SSL handshakes failed because of no common protocol",
        "type": "counter"
    },
    "no_common_cipher": {
        "help": "SSL handshakes failed because of no shared cipher",
        "type": "counter"
    },
    "handshake_timeout": {
        "help": "SSL handshakes failed because of a timeout",
        "type": "counter"
    },
    "peer_rejected_cert": {
        "help": "Failed SSL handshakes due to rejected certificate by peer",
        "type": "counter"
    },
    "verify_failures": {
       "expired_cert": {
           "help": "An expired or not yet valid certificate was presented by a client",
           "type": "counter"
       },
       "revoked_cert": {
           "help": "A revoked certificate was presented by a client",
           "type": "counter"
       },
       "no_cert": {
           "help": "A client did not provide the required certificate",
           "type": "counter"
       },
       "hostname_mismatch": {
           "help": "Server's certificate doesn't match the hostname",
           "type": "counter"
       },
       "other": {
           "help": "Other SSL certificate verification errors",
           "type": "counter"
       }
    }
};

var PageMetrics = {
    "used": {
        "help": "Current number of used memory pages",
        "type": "gauge"
    },
    "free": {
        "help": "Current number of free memory pages",
        "type": "gauge"
    },
};

var SlotSpecifiers = [
    "8",
    "16",
    "32",
    "64",
    "128",
    "256",
    "512",
    "1024",
    "2048"
];

var SlotMetrics = {
    "used": {
        "help": "Current number of used memory slots",
        "type": "gauge",
        "metrics": SlotSpecifiers,
        "label": "slot"
    },
    "free": {
        "help": "Current number of free memory slots",
        "type": "gauge",
        "metrics": SlotSpecifiers,
        "label": "slot"
    },
    "reqs": {
        "help": "Total number of attempts to allocate memory of specified size",
        "type": "gauge",
        "metrics": SlotSpecifiers,
        "label": "slot"
    },
    "fails": {
        "help": "Total number of unsuccessful attempts to allocate memory of specified size",
        "type": "gauge",
        "metrics": SlotSpecifiers,
        "label": "slot"
    }
};

var SlabMetrics = {
    "pages": {
        "metrics": PageMetrics
    },
    "slots": {
        "handler": slot_handler,
        "specifiers": SlotSpecifiers,
        "metrics": SlotMetrics
    }
};

var ZoneSyncStatusMetrics = {
    "nodes_online": {
        "help": "Total number of peers this node is conected to",
        "type": "counter"
    },
    "msgs_in": {
        "help": "Total messages received by this node",
        "type": "counter"
    },
    "msgs_out": {
        "help": "Total messages sent by this node",
        "type": "counter"
    },
    "bytes_in": {
        "help": "Bytes received by this node",
        "type": "counter"
    },
    "bytes_out": {
        "help": "Bytes sent by this node",
        "type": "counter"
    }
};

var ZoneSyncZoneMetrics = {
    "records_total": {
        "help": "The total number of records stored in the shared memory zone",
        "type": "counter",
    },
    "records_pending": {
        "help": "The number of records that need to be sent to the cluster",
        "type": "counter",
    }
};

var ZoneSyncMetrics = {
    "status": {
        "handler": change_base,
        "next_handler": default_metric_callback,
        "metrics": ZoneSyncStatusMetrics,
    },
    "zones": {
        "handler": change_base,
        "next_handler": named_metric_callback,
        "metrics": ZoneSyncZoneMetrics,
        "specifierContext": "zone"
    }
};

var WorkersMemMetrics ={
    "rss": {
        "handler": system_rss_callback,
        "help": "Resident set size (pss), physical memory NGINX workers are using, including shared libraries",
        "type": "counter"
    },
    "private": {
        "handler": system_private_callback,
        "help": "Private memory used by NGINX workers, does not include shared libraries",
        "type": "counter"
    },
}

var NGINXStatusContext = {
    "handler": build_nginx_status,
    "metrics": NGINXStatusMetrics,
    "context": "nginx"
};

var ProcessesContext = {
    "handler": default_metric_callback,
    "metrics": ProcessMetrics,
    "context": "processes"
};

var WorkersContext = {
    "handler": named_metric_callback,
    "metrics": WorkerMetrics,
    "context": "workers",
    "specifierContext": "id"
}

var ConnectionContext = {
    "handler": default_metric_callback,
    "metrics": ConnectionMetrics,
    "context": "connections"
};

var SslContext = {
    "handler": default_metric_callback,
    "metrics": SslMetrics,
    "context": "ssl"
};

var SlabContext = {
    "handler": prepend_metric_handler,
    "metrics": SlabMetrics,
    "context": "slab",
    "specifierContext": "zone"
};

var HttpRequestContext = {
    "handler": default_metric_callback,
    "metrics": HttpRequestMetrics,
    "context": "http_requests"
};

var HttpCacheContext = {
    "handler": named_metric_callback,
    "metrics": HttpCacheMetrics,
    "context": "cache",
    "specifierContext": "zone"
}

var UpstreamContext = {
    "handler": named_metric_callback,
    "metrics": UpstreamMetrics,
    "context": "upstream"
};

var ServerZoneContext = {
    "handler": named_metric_callback,
    "metrics": ServerZoneMetrics,
    "context": "server_zone"
};

var LocationZoneContext = {
    "handler": named_metric_callback,
    "metrics": LocationZoneMetrics,
    "context": "location_zone"
};

var ResolverContext = {
    "handler": named_metric_callback,
    "metrics": ResolverMetrics,
    "context": "resolver"
};

var StreamUpstreamContext = {
    "handler": named_metric_callback,
    "metrics": StreamUpstreamMetrics,
    "context": "stream_upstream",
    "specifierContext": "upstream"
};

var StreamServerZoneContext = {
    "handler": named_metric_callback,
    "metrics": StreamServerZoneMetrics,
    "context": "stream_server_zone",
    "specifierContext": "server_zone"
};

var ZoneSyncContext = {
    "metrics": ZoneSyncMetrics,
    "context": "stream_zone_sync"
};

var WorkersMemContext = {
    "metrics": WorkersMemMetrics,
    "context": "workers_mem"
};

var LimitConnsContext = {
    "handler": named_metric_callback,
    "metrics": LimitConnsMetrics,
    "context": "limit_conns",
    "specifierContext": "zone"
};

var LimitReqsContext = {
    "handler": named_metric_callback,
    "metrics": LimitReqsMetrics,
    "context": "limit_reqs",
    "specifierContext": "zone"
};

var Metrics = [
    [
        "/api/9/nginx",
        NGINXStatusContext
    ],
    [
        "/api/9/processes",
        ProcessesContext
    ],
    [
        "/api/9/connections",
        ConnectionContext
    ],
    [
        "/api/9/ssl",
        SslContext
    ],
    [
        "/api/9/workers",
        WorkersContext
    ],
    [
        "/api/9/slabs",
        SlabContext
    ],
    [
        "/api/9/resolvers",
        ResolverContext
    ],
    [
        "/api/9/http/requests",
        HttpRequestContext
    ],
    [
        "/api/9/http/caches",
        HttpCacheContext
    ],
    [
        "/api/9/http/limit_conns",
        LimitConnsContext
    ],
    [
        "/api/9/http/upstreams",
        UpstreamContext,
        replace_with_keyval
    ],
    [
        "/api/9/http/server_zones",
        ServerZoneContext
    ],
    [
        "/api/9/http/location_zones",
        LocationZoneContext
    ],
    [
        "/api/9/stream/limit_conns",
        LimitConnsContext
    ],
    [
        "/api/9/http/limit_reqs",
        LimitReqsContext
    ],
    [
        "/api/9/stream/upstreams",
        StreamUpstreamContext,
        replace_with_keyval
    ],
    [
        "/api/9/stream/server_zones",
        StreamServerZoneContext
    ],
    [
        "/api/9/stream/zone_sync",
        ZoneSyncContext
    ],
    [
        "workers/mem",
        WorkersMemContext,
        workers_mem_collector
    ]
];

function metrics(r) {
    numSubrequests = Metrics.length;

    disable_metrics(r);
    Metrics.forEach(function(m) {
        ngx_collect_metrics.apply(null, [r].concat(m));
    });
}

function disable_metrics(r) {
    if (r.variables.prom_metrics_disabled == undefined  ||
        r.variables.prom_metrics_disabled == "") {
        return;
    }
    var disabledMetrics = r.variables.prom_metrics_disabled.split(/, */g);

    for (var i = 0; i < disabledMetrics.length; i++) {
        var metric = disabledMetrics[i];
        for (var j = 0; j < Metrics.length; j++) {
            var urlSplit;
            if(Metrics[j][0].startsWith("/api")) {
                urlSplit = Metrics[j][0].slice(7);
            } else {
                urlSplit = Metrics[j][0]
            }
            if (urlSplit == metric) {
                Metrics[j][1].disabled = true;
                numSubrequests--;
                break;
            }
            if (j == Metrics.length - 1) {
                r.error("specified metric to disable does not exist: " + metric);
            }
        }
    }
}

// ngx_collect_metrics makes a subrequest to a designated url and then passes the
// resulting object to a handler to build the response for the metrics passed in
function ngx_collect_metrics(r, url, objContext, filterHandler) {
    if (!objContext.disabled) {
        if (url.startsWith("/api")) {
            r.subrequest(url, { method: 'GET' }, function (res) {
                if (res.status >= 300 || res.responseText == "{}") {
                    if (--numSubrequests == 0) {
                        ngx_send_response(r);
                    }
                    return;
                }
                contentLength += res.responseText.length;

                var obj = JSON.parse(res.responseText);
                var resp = null;
                if (filterHandler) {
                    resp = filterHandler(r, obj, objContext, res.uri);
                }
                if (resp == null) {
                    var buf = process_obj(obj, objContext);
                    responseBuffer.push(buf);
                    if (--numSubrequests == 0) {
                        ngx_send_response(r);
                        return;
                    }
                }
            });
        } else {
            var buf;
            if (filterHandler) {
                filterHandler(r, "", objContext, "") ;
            }
            buf = process_obj("", objContext);
            responseBuffer.push(buf);
            if (--numSubrequests == 0) {
                ngx_send_response(r);
                return;
            }
        }
    }
    if (numSubrequests == 0) {
        ngx_send_response(r);
    }
}

// replace_with_keyval makes a subrequest to the keyval specified by the variable
// "prom_keyval" and replaces all object names if they are in the keyval map
// keyval map should take the form replacement : object-to-replace
function replace_with_keyval(r, obj, objContext, uri) {
    var zone = uri.split("/")[3];
    var keyValUpstream = NaN;
    if (zone == "http")
        keyValUpstream = r.variables.prom_keyval;
    else if (zone == "stream")
        keyValUpstream = r.variables.prom_keyval_stream;
    if (keyValUpstream) {
        r.subrequest("/api/9/" + zone + "/keyvals/" + keyValUpstream, { method: 'GET' },
            function (res) {
                if (res.status < 300 && res.responseText != "{}") {
                    var keyVal = JSON.parse(res.responseText);
                    var keyValEnum = Object.entries(keyVal);
                    for (var i = 0; i < keyValEnum.length; i++) {
                        var upstreamMap = keyValEnum[i];
                        if (obj[upstreamMap[1]] != null) {
                            obj[upstreamMap[0]] = obj[upstreamMap[1]];
                            delete obj[upstreamMap[1]];
                        }
                    }
                }
                var buf = process_obj(obj, objContext);
                responseBuffer.push(buf);
                if (--numSubrequests == 0) {
                    ngx_send_response(r);
                    return;
                }
            });
        return NaN;
    } else {
        return null;
    }
}

function convert_to_number(r, s) {
    var number = parseInt(s.split(" ")[0]);
    var unit = s.split(" ")[1];
    var multiplier = 1;

    switch (unit.toLowerCase()) {
    case "kb":
        multiplier = 1024;
        break;
    case "mb":
        multiplier = 1024*1024;
        break;
    case "gb":
        multiplier = 1024*1024*1024;
        break;
    default:
        multiplier = 1

    }

    return number * multiplier;
}

function workers_mem_collector(r, obj, objContext, uri) {
    var fs = require('fs');
    var fileName;
    var procList;
    var procName;
    var pid;
    var match;
    var vmRSS;
    var rssAnon;

    try {
        fileName = "/proc/" + process.ppid + "/task/" + process.ppid + "/children";
        procList = fs.readFileSync(fileName, 'utf8').trim().split(" ");

        for (pid in procList) {
            // Skip the cache manager process
            fileName = "/proc/" + procList[pid] + "/cmdline"
            procName = fs.readFileSync(fileName, "utf8").toString();
            if (procName.match("nginx: worker process") == null) {
                continue;
            }

            fileName = "/proc/" + procList[pid] + "/status"
            var procStatus = fs.readFileSync(fileName, 'utf8');
            match = procStatus.match(/VmRSS:\s*(.*)\n/)
            if (match != null) {
                vmRSS = convert_to_number(r, match[1]);
            }
            match = procStatus.match(/RssAnon:\s*(.*)\n/)
            if (match != null) {
                rssAnon = convert_to_number(r, match[1]);
            }

            private_mem += rssAnon;
        if (rss == 0) {
                // Only count the shared libraries once
                rss += vmRSS
        } else {
                rss += rssAnon
            }
        }
    }
    catch(err) {
        rss = 0;
        private_mem = 0;
        r.log("Unable to read " + fileName + ": " + err.message);
    }
}

// process_obj is the callback from the ngx_collect_metrics function and is
// responsible for printing the metric help text as well as calling the handler
// associated with a certain metric
function process_obj(obj, objContext) {
    var buffer = [];
    var metricsEnum = Object.entries(objContext.metrics);
    var metricContext = objContext.context;
    var handler = objContext.handler;

    for (var i = 0; i < metricsEnum.length; i++) {
        var metric = metricsEnum[i];
        // Print metric information
        if (metric[1].help != null) {
            buffer.push(print_metric_help_text(metricContext, metric));
        }

        var specifierContext = objContext.context;
        if (objContext.specifierContext != null) {
            specifierContext = objContext.specifierContext;
        }
        // Call if metric has associated handler
        if (metric[1].handler != null) {
            buffer.push(metric[1].handler(obj, metric, metricContext,
                specifierContext));
            // Call if metric has any nested metric handler
            if (metric[1].nested_handler != null) {
                buffer.push(metric[1].nested_handler(obj, objContext, metric));
            }
        } else {
            // Else call default handler
            buffer.push(handler(obj, metric, metricContext, specifierContext));
        }
    }

    return buffer.join("");
}

// build_nginx_status builds the status metrics for NGINX, using version,
// build, address, ppid metrics in a specifier.
function build_nginx_status(obj, metric, context) {
    var objString = JSON.stringify(obj).replace(/":([^",}]+)/g, "\":\"$1\"").
        replace(/"generation":"\d+",/, "").
        replace(/"load_timestamp":".*",/, "").
        replace(/"timestamp":".*",/, "").
        replace(/"pid":"\d+",/, "");

    switch (metric[0]) {
    case "config_generation":
        return build_metric(context,
            metric[0],
            obj["generation"],
            JSON.parse(objString));
    case "config_uptime":
        return build_metric(context,
            metric[0],
            parseInt(((new Date(obj["timestamp"])).getTime() -
                (new Date(obj["load_timestamp"])).getTime())/1000),
            JSON.parse(objString));
    default:
        return build_metric(context,
            metric[0],
            obj[metric[0]],
            JSON.parse(objString));
    }
}

// default_metric_callback assumes that there is only a single object of metrics
// to be printed. It returns metrics without a specifier attached to them
function default_metric_callback(obj, metric, context) {
    if (typeof(obj[metric[0]]) === 'object' && !Array.isArray(obj[metric[0]])) {
        return process_obj(obj[metric[0]], {
            "metrics": metric[1],
            "context": context + "_" + metric[0],
            "handler": default_metric_callback
        });
    } else {
        return build_metric(context, metric[0], obj[metric[0]], null);
    }
}

// named_metric_callback assumes that there are multiple elements to be returned,
// each formatted as a name : [object] pair in which the name will be used
// in conjunction with the specifierContext to build a specifier
function named_metric_callback(obj, metric, context, specifierContext) {
    var buffer = [];
    var arrayEnum = Object.entries(obj);

    for (var j = 0; j < arrayEnum.length; j++) {
        var arrayKey = arrayEnum[j][0];
        var arrayObj = arrayEnum[j][1];
        var metric_val = arrayObj[metric[0]];
        var specifierObj = {};
        if (metric[1].printFilter != null) {
            metric_val = metric[1].printFilter(arrayObj[metric[0]]);
        }
        // On iterations after initial, specifier object may be set, representing
        // past base contexts to be printed
        if (arrayObj.specifierObj != null) {
            specifierObj = arrayObj.specifierObj;
        }

        var set = false;
        if (specifierObj[specifierContext] == null) {
            specifierObj[specifierContext] = arrayKey;
            set = true;
        }
        buffer.push(build_metric(context, metric[0], metric_val, specifierObj));
        if (set) {
            delete specifierObj[specifierContext];
        }
    }

    return buffer.join("");
}

// upstream_server_handler is responsible for building the name : object pair
// that named_metric_callback expects, except with peer servers instead of
// upstreams
function upstream_server_handler(obj, metric, context, specifierContext) {
    var nextObj = {};
    var upstreamsEnum = Object.entries(obj);
    var metric_name = metric[0];
    var metric_obj = metric[1];

    for (var upstreamIdx = 0; upstreamIdx < upstreamsEnum.length; upstreamIdx++) {
        var upstream = upstreamsEnum[upstreamIdx][1];

        for (var peerIdx = 0; peerIdx < upstream[metric_name].length; peerIdx++) {
            var peer = upstream[metric_name][peerIdx];
            var specifierObj = {};
            var placeholderKey = peer.server + "_" + upstreamIdx;

            // Add specifier for upstream to object to attach to peer
            specifierObj[specifierContext] = upstreamsEnum[upstreamIdx][0];
            specifierObj[metric_obj.specifierContext] = peer.server;

            nextObj[placeholderKey] = peer;
            nextObj[placeholderKey].specifierObj = specifierObj;
        }
    }

    metric_obj.handler = named_metric_callback;

    return process_obj(nextObj, metric_obj);
}

// labeled_metric_handler allows for object metrics to be printed, in which each
// member in the object is added to the metric as a specifier represented by
// specifierContext
function labeled_metric_handler(obj, metric, context, specifierContext) {
    var buffer = [];
    var objEnum = Object.entries(obj);

    for (var i = 0; i < objEnum.length; i++) {
        var iterKey = objEnum[i][0];
        var iterObj = objEnum[i][1];
        var labelObj = iterObj[metric[0]];
        var specifierObj = {}
        if (iterObj.specifierObj != null) {
            specifierObj = iterObj.specifierObj;
        }
        var set = false;
        if (specifierObj[specifierContext] == null) {
            specifierObj[specifierContext] = iterKey;
            set = true;
        }
        if (labelObj != null) {
            buffer.push(build_labeled_metrics(labelObj, metric, context, specifierObj));
        }
        if (set) {
            delete specifierObj[specifierContext];
        }
    }

    return buffer.join("");
}

// nested_metric_handler allows to exclusively process nested metric
// objects by calling process_obj, while the object and its context are changed
// in such a way that the nested metric is moved one level up.
function nested_metric_handler(obj, objContext, metric) {
    var parentMetricKey = metric[0];
    var nestedContext = Object.assign({}, objContext);

    var metricEnum = Object.entries(metric[1]);
    for (var i=0; i < metricEnum.length; i++) {
        var iterKey = metricEnum[i][0];
        var iterObj = metricEnum[i][1];

        if (typeof (iterObj) === 'object' && !Array.isArray(iterObj)) {
            var nestedMetricKey = parentMetricKey + "_" + iterKey;
            nestedContext.metrics = {};
            nestedContext.metrics[nestedMetricKey] = objContext.metrics
                [parentMetricKey][iterKey];

            var objEnum = Object.entries(obj);
            for (var j = 0; j < objEnum.length; j++) {
                var iterObjKey = objEnum[j][0];
                if (obj[iterObjKey][parentMetricKey] != null) {
                    obj[iterObjKey][nestedMetricKey] = obj[iterObjKey]
                       [parentMetricKey][iterKey];
                }
            }
        }
    }

    return process_obj(obj, nestedContext);
}

// build_labeled_metrics builds the metrics and adds the "code" to the specifier
function build_labeled_metrics(labelObj, metric, context, specifierObj) {
    var buffer = [];
    var labelMetrics = metric[1].metrics;

    for (var i = 0; i < labelMetrics.length; i++) {
        var labelMetric = labelMetrics[i];
        specifierObj[metric[1].label] = labelMetric;
        buffer.push(build_metric(context, metric[0], labelObj[labelMetric],
            specifierObj));
    }

    delete specifierObj[metric[1].label];

    return buffer.join("");
}

// prepend_metric_handler allows for object metrics to be printed, in which each
// member is appended to the base object name and which corresponds to an object
// in the subrequest response
function prepend_metric_handler(obj, metric, context, specifierContext) {
    var buffer = [];
    var objEnum = Object.entries(obj);
    var prependMetrics = metric[1].metrics;
    var prependMetricsEnum = Object.entries(prependMetrics);

    for (var i = 0; i < prependMetricsEnum.length; i++) {
        var prependMetric = prependMetricsEnum[i];
        var printableMetric = {};
        printableMetric[metric[0] + "_" + prependMetric[0]] = prependMetric[1];
        if (prependMetric[1].help != null) {
            buffer.push(print_metric_help_text(context,
                Object.entries(printableMetric)[0]));
        }

        for (var j = 0; j < objEnum.length; j++) {
            var iterKey = objEnum[j][0];
            var iterObj = objEnum[j][1];
            if (specifierContext != null) {
                var specifierObj = {};
                if (iterObj.specifierObj != null) {
                    specifierObj = iterObj.specifierObj;
                }
                var set = false;
                if (specifierContext != null && specifierObj[specifierContext] == null) {
                    specifierObj[specifierContext] = iterKey;
                    set = true;
                }
            }
            var prependMetricValue = iterObj[metric[0]][prependMetric[0]];
            buffer.push(build_metric(context, metric[0] + "_" + prependMetric[0],
                prependMetricValue, specifierObj));
            if (set) {
                delete specifierObj[specifierContext];
            }
        }
    }

    return buffer.join("");
}

// change_base modifies the passed obj to go down one node based on the metric
// name.
// zones: {                 becomes     {
//     "records_total",      ---->          "records_total",
//     "records_pending"                    "records_pending"
// }                                    }
// then calls process_obj again with handler replaced with next_handler
function change_base(obj, metric, context, specifierContext) {
    var newObj = obj[metric[0]];
    var metric_obj = metric[1];

    if (metric_obj.next_handler == null) {
        return null;
    }

    metric_obj.handler = metric_obj.next_handler;
    metric_obj.context = context + "_" + metric[0];

    return process_obj(newObj, metric_obj);
}

// convert_state converts the metric "state" value to a prometheus-compliant value
function convert_state(metric) {
    switch (metric) {
    case "up":
        return 1;
    case "draining":
        return 2;
    case "down":
        return 3;
    case "unavail":
        return 4;
    case "checking":
        return 5;
    case "unhealthy":
        return 6;
    case true:
        return 1;
    default:
        return 0;
    }
}

// slot_handler swaps the slot and metric information so that it can call
// labeled_metric_handler
function slot_handler(obj, metric, context, specifierContext) {
    var objEnum = Object.entries(obj);
    var metricsEnum = Object.entries(metric[1].metrics);
    var specifiers = metric[1].specifiers;

    for (var i = 0; i < objEnum.length; i++) {
        var iterKey = objEnum[i][0];
        var iterValue = objEnum[i][1];
        obj[iterKey] = iterValue["slots"];
        for (var j = 0; j < metricsEnum.length; j++) {
            var iterMetric = metricsEnum[j][0];
            obj[iterKey][iterMetric] = {}
            for (var k = 0; k < specifiers.length; k++) {
                obj[iterKey][iterMetric][specifiers[k]] =
                    obj[iterKey][specifiers[k]][iterMetric];
            }
        }
        for (var j = 0; j < specifiers.length; j++) {
            delete obj[iterKey][specifiers[j]];
        }
    }

    metric[1].handler = labeled_metric_handler;
    metric[1].context = context;
    metric[1].specifierContext = specifierContext;

    return process_obj(obj, metric[1]);
}

// system_rss_callback returns prometheus formatted NGINX resident
// set size (rss)
function system_rss_callback(obj, metric, context, specifierContext) {
    return build_metric(context, metric[0], rss, null);
}

// system_private_callback returns prometheus formatted NGINX private
// clean + dirty pages
function system_private_callback(obj, metric, context, specifierContext) {
    return build_metric(context, metric[0], private_mem, null);
}

// build_metric returns the prometheus-formatted metric for a particular NGINX
// metric
function build_metric(context, metric, metric_val, specifierObj) {
    var specifier = "";

    if (specifierObj != null) {
        specifier = build_specifier(specifierObj);
    }
    if (metric_val == undefined) {
        metric_val = 0;
    }

    return NGINX_PLUS_CONTEXT + "_" + context + "_" + metric + " " +
        specifier + metric_val + "\n";
}

// build_specifier returns the JSON-like prometheus specifier associated with a
// metric
function build_specifier(specifierObj) {
    return JSON.stringify(specifierObj).replace(/\"([^(\")"]+)\":/g, "$1=") + " ";
}

// print_metric_help_text returns the "HELP" and "TYPE" text associated with a
// metric
function print_metric_help_text(context, metric) {
    var metric_context = NGINX_PLUS_CONTEXT + "_" + context + "_" + metric[0];
    var metric_type = metric[1].type == undefined ? "untyped" : metric[1].type;

    return "# HELP " + metric_context + " " + metric[1].help + "\n" +
        "# TYPE " + metric_context + " " + metric_type + "\n";
}

// ngx_send_response returns the response through the NGINX response object with
// the built response buffer
function ngx_send_response(r) {
    r.headersOut['Content-Type'] = "text/plain";
    r.return(200, responseBuffer.join(""));
}

export default { metrics };