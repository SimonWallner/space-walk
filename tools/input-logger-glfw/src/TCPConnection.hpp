#pragma once

#include <boost/asio.hpp>
#include <boost/bind.hpp>
#include <boost/shared_ptr.hpp>
#include <boost/enable_shared_from_this.hpp>

class TCPConnection : public boost::enable_shared_from_this<TCPConnection>
{
public:
	typedef boost::shared_ptr<TCPConnection> pointer;
	
	static pointer create(boost::asio::io_service& io_service);
    boost::asio::ip::tcp::socket& getSocket();
	void start();
    
    void send(std::string message);
    
private:
	TCPConnection(boost::asio::io_service& io_service);
    
	void handleWrite(const boost::system::error_code& error, size_t bitesTransferred, std::shared_ptr<std::string> message);
    
    boost::asio::ip::tcp::socket socket;
//    bool connected;
};