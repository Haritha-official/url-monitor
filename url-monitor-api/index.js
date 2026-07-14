const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 8080

app.use(cors())
app.use(express.json())

// In-memory storage - array of monitors
let monitors = []

app.post('/monitors', (req, res) => {
    const { name, url } = req.body

    if(!name || !url) {
        return res.status(400).json({
            error: "Name and URL are required"
        })
    }
    
    const monitor = {
        id: Date.now(),
        name, 
        url,
        status: "pending",
        responseTime: null,
        lastChecked: null,
        createdAt: new Date().toISOString()
    }

    monitors.push(monitor)

    res.status(201).json({
        message: "Monitor added",
        monitor
    })
})

app.get('/monitors', (req, res) => {
    res.json({
        count: monitors.length,
        monitors
    })
})

app.get('/monitors/:id', (req, res) => {
    const monitorId = Number(req.params.id)
    
    const monitor = monitors.find(m => m.id === monitorId)

    if(!monitor) {
        return res.status(404).json({ error: "Monitor not found" })
    }

    res.json(monitor)
})

app.delete('/monitors/:id', (req, res) => {
    const monitorId = Number(req.params.id)

    const monitor = monitors.find(m => m.id === monitorId)

    if(!monitor) {
        return res.status(404).json({ error: "Monitor not found"})
    }

    monitors = monitors.filter(m => m.id !== monitorId)

    res.json({
        message: "Monitor deleted"
    })
})

app.get('/monitors/:id/check', async (req, res) => {
    const monitorId = Number(req.params.id)

    const monitor = monitors.find(m => m.id === monitorId)

    if(!monitor) {
        return res.status(404).json({
            error: "Monitor not found"
        })
    }

    try {
        const start = Date.now()
        const response = await fetch(monitor.url)
        const  responseTime = Date.now() - start

        const index = monitors.findIndex(m => m.id === monitorId)

        monitors[index] = {
            ...monitors[index],
            status: response.ok ? "online" : "offline",
            responseTime,
            lastChecked: new Date().toISOString()
        }

        res.json(monitors[index])

    } catch (error) {
        const index = monitors.findIndex(m => m.id === monitorId)

        monitors[index] = {
            ...monitors[index],
                status: "offline",
                responseTime: null,
                lastChecked: new Date().toISOString()
       }
       
       res.json(monitors[index])
       
    }
})

const checkAllMonitors = async () => {
    if (monitors.length === 0) return

    console.log(`Auto-checking ${monitors.length} monitor(s)...`)

    // loop through every monitor and check it
    // same logic as your /check route
    // use for...of loop since forEach doesn't handle async well

    for (const monitor of monitors) {
        try {
            const start = Date.now()
            const response = await fetch(monitor.url)
            const responseTime = Date.now() - start

            const index = monitors.findIndex(m => m.id === monitor.id)
            monitors[index] = {
                ...monitors[index],
                status: response.ok ? "online" : "offline",
                responseTime,
                lastChecked: new Date().toISOString()
            }

            console.log(`✓ ${monitor.name} — ${monitors[index].status} (${responseTime}ms)`)

        } catch (err) {
            const index = monitors.findIndex(m =>m.id === monitor.id)
            monitors[index] = {
                ...monitors[index],
                status: "offline",
                responseTime: null,
                lastChecked: new Date().toISOString()
            }
            console.log(`✗ ${monitor.name} — offline`)
        }
    }
}

//Run immediately when server starts, then every 60 seconds
checkAllMonitors()
setInterval(checkAllMonitors, 60000)

app.listen(PORT, () => {
    console.log(`URL Monitor API running on http://localhost:${PORT}`)
})
