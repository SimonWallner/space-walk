#include "TCPConnection.hpp"

#include <iostream>

#include "compiler.h"

using boost::asio::ip::tcp;

TCPConnection::pointer TCPConnection::create(boost::asio::io_service& io_service)
{
	return pointer(new TCPConnection(io_service));
}

tcp::socket& TCPConnection::getSocket()
{
	return socket;
}

void TCPConnection::start()
{
    std::cout << "start!" << std::endl;
}

void TCPConnection::send(std::string message)
{
    if (socket.is_open()) {
        // std::cout << "sending data..." << std::endl;

        boost::asio::async_write(socket, boost::asio::buffer(message),
             boost::bind(&TCPConnection::handleWrite, shared_from_this(),
             boost::asio::placeholders::error,
             boost::asio::placeholders::bytes_transferred));
    }
    else
    {
        // std::cout << "socket not open!" << std::endl;
    }
}

TCPConnection::TCPConnection(boost::asio::io_service& io_service)
	: socket(io_service)
//	, connected(false)
{}

void TCPConnection::handleWrite(const boost::system::error_code& error, size_t bitesTransferred)
{
    UNUSED bitesTransferred;

    if (error.value() != boost::system::errc::success)
    {
        std::cout << "Encountered write error! errc: " << error << ", value: " << error.message() << std::endl;
    }
}
