#include "gw2DatTools/exception/Exception.h"

namespace gw2dt
{
namespace exception
{

Exception::Exception(const char* iReason) :
    std::runtime_error(iReason)
{
}

Exception::~Exception() throw() 
{
}

}
}
