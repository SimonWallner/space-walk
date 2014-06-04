#pragma once

#include <vector>
#include <boost/asio.hpp>

#include "TCPConnection.hpp"

class TCPServer
{
public:
    TCPServer(boost::asio::io_service& io_service, unsigned int port);
    void broadcast(std::string message);
    
private:
    void startAccept();
	void handleAccept(TCPConnection::pointer new_connection,
		const boost::system::error_code& error);

    
    boost::asio::ip::tcp::acceptor acceptor;
    std::vector<TCPConnection::pointer> connections;
};
