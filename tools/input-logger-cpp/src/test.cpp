#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>
#include <chrono>
#include <thread>
#include <sstream>

#include "compiler.h"
#include "TCPServer.hpp"

int main(int argc, char** argv)
{
    // defaults
    unsigned int port = 60601;
    
    // command line params
    if (argc >= 2) {
        port = atoi(argv[1]);
    } else {
        std::cout << "Serving at default port: " << port << std::endl;
        std::cout << "call 'input-logger xxxxxx' to specify the port manually." << std::endl;
    }
    std::cout << "setting up server..." << std::endl;
    // setup networking
    boost::asio::io_service io_service;
    TCPServer server(io_service, port);
    
    while(true) {
        server.data("adf", 42, 42);
    }
}
