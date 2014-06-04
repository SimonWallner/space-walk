#include "TCPServer.hpp"
#include "TCPConnection.hpp"

using boost::asio::ip::tcp;

TCPServer::TCPServer(boost::asio::io_service& io_service, unsigned int port)
	: acceptor(io_service, tcp::endpoint(tcp::v4(), port))
{
	startAccept();
}

void TCPServer::startAccept()
{
	TCPConnection::pointer new_connection = TCPConnection::create(acceptor.get_io_service());
    connections.push_back(new_connection);

	acceptor.async_accept(new_connection->getSocket(),
		boost::bind(&TCPServer::handleAccept, this, new_connection,
		boost::asio::placeholders::error));
}

void TCPServer::handleAccept(TCPConnection::pointer new_connection,
	const boost::system::error_code& error)
{
    if (!error)
    {
    	new_connection->start();
    }

	startAccept();
}

void TCPServer::broadcast(std::string message)
{
	for (auto connectionPointer : connections)
    {
		connectionPointer->send(message);
    }
}